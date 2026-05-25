import { Inject, Provide } from '@midwayjs/core';
import { PlaywrightCrawler, RequestQueue, Configuration } from 'crawlee';
Configuration.getGlobalConfig().set('persistStorage', false);

Configuration.getGlobalConfig().set('systemInfoV2', true);
import * as TurndownService from 'turndown';
import { PluginService } from '../../plugin/service/info';
import { v4 as uuidv4 } from 'uuid';

/**
 * 多文档加载器
 */
@Provide()
export class KnowLinkLoader {
  @Inject()
  pluginService: PluginService;

  /**
   * 加载链接
   * @param link
   * @param options 选项配置
   * @param options.isMd 转为markdown
   * @param options.downloadImages 是否下载图片并替换链接
   * @param options.titleOnly 是否只获取标题
   */
  async load(
    link: string,
    options?: { isMd?: boolean; downloadImages?: boolean; titleOnly?: boolean }
  ) {
    // 设置默认选项
    const defaultOptions = {
      isMd: false,
      downloadImages: false,
      titleOnly: false,
    };
    const opts = { ...defaultOptions, ...options };

    const uploadPlugin = await this.pluginService.getInstance('upload');

    let result = [];
    // 创建一个唯一的请求队列
    const requestQueue = await RequestQueue.open(
      `queue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    );
    const getRootUrl = (url: string) => {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${
        urlObj.port ? ':' + urlObj.port : ''
      }`;
    };
    let crawler = new PlaywrightCrawler({
      requestQueue,
      requestHandler: async ({ request, page }) => {
        try {
          // 设置页面超时时间 - 只获取标题时减少超时时间
          page.setDefaultTimeout(opts.titleOnly ? 8000 : 15000);

          // 等待页面基本加载完成
          await Promise.race([
            page.waitForLoadState('domcontentloaded'),
            new Promise(resolve =>
              setTimeout(resolve, opts.titleOnly ? 3000 : 5000)
            ),
          ]);

          // 处理微信公众号可能的验证页面
          const isWechatArticle =
            request.loadedUrl.includes('mp.weixin.qq.com');

          await page.waitForTimeout(opts.titleOnly ? 1000 : 3000);
          // 等待页面可见
          await page.waitForSelector('body', { state: 'visible' });

          // 获取页面标题
          const title = await page.title();

          // 如果只需要标题，则直接返回
          if (opts.titleOnly) {
            result.push({
              title,
              url: request.loadedUrl,
              content: `标题: ${title}`,
            });
            return;
          }

          // 对页面进行滚动，以触发懒加载图片
          await page.evaluate(async () => {
            // 平滑滚动到页面底部以加载所有懒加载图片
            const scrollStep = window.innerHeight / 2;
            const scrollDelay = 100;

            const scrollToBottom = async () => {
              const bodyHeight = document.body.scrollHeight;
              for (let i = 0; i <= bodyHeight; i += scrollStep) {
                window.scrollTo(0, i);
                // 等待一小段时间，使懒加载图片有时间加载
                await new Promise(resolve => setTimeout(resolve, scrollDelay));
              }
              // 滚动回页面顶部
              window.scrollTo(0, 0);
            };

            await scrollToBottom();

            // 尝试移除懒加载属性，强制加载图片
            const lazyImages = document.querySelectorAll(
              'img[data-src], img[loading="lazy"]'
            );
            lazyImages.forEach(img => {
              if ((img as HTMLImageElement).dataset.src) {
                (img as HTMLImageElement).src = (
                  img as HTMLImageElement
                ).dataset.src;
                img.removeAttribute('data-src');
              }
              if (img.hasAttribute('loading')) {
                img.removeAttribute('loading');
              }
            });

            // 等待可能的图片加载完成
            await new Promise(resolve => setTimeout(resolve, 2000));
          });

          // 等待一段时间确保动态内容加载
          await page.waitForTimeout(3000);

          let content = '';
          try {
            // 对微信公众号文章使用特殊处理
            if (isWechatArticle) {
              content = await page.evaluate(() => {
                // 微信公众号文章通常在这些选择器中
                const possibleContentSelectors = [
                  '#js_content',
                  '.rich_media_content',
                  '.rich_media_area_primary',
                  'div.rich_media_wrp',
                ];

                let articleContent = '';
                for (const selector of possibleContentSelectors) {
                  const element = document.querySelector(selector);
                  if (element) {
                    // 处理图片
                    const images = element.querySelectorAll('img');
                    images.forEach(img => {
                      // 确保使用正确的图片源
                      if (
                        (img as HTMLImageElement).dataset.src &&
                        !(img as HTMLImageElement).src
                      ) {
                        (img as HTMLImageElement).src = (
                          img as HTMLImageElement
                        ).dataset.src;
                      }
                      // 对于微信，可能需要查找多种图片源属性
                      const imgSrc =
                        (img as HTMLImageElement).src ||
                        (img as HTMLImageElement).dataset.src ||
                        img.getAttribute('data-src') ||
                        img.getAttribute('data-original') ||
                        img.getAttribute('data-actualsrc');

                      if (imgSrc) {
                        const altText = (img as HTMLImageElement).alt || '';
                        const titleText = (img as HTMLImageElement).title || '';
                        // 创建Markdown格式的图片
                        const imgMd = `![${altText}](${imgSrc}${
                          titleText ? ` "${titleText}"` : ''
                        })`;
                        // 在图片位置插入标记
                        const placeholder = document.createElement('span');
                        placeholder.textContent = imgMd;
                        if (img.parentNode) {
                          img.parentNode.insertBefore(placeholder, img);
                        }
                      }
                    });

                    articleContent = (element as HTMLElement).innerText;
                    break;
                  }
                }

                return articleContent || document.body.innerText;
              });
            } else {
              // 原有的一般网站内容提取逻辑
              content = await page.evaluate(() => {
                // 扩展的内容容器选择器
                const selectors = [
                  // 通用内容容器
                  'article',
                  'main',
                  '[role="main"]',
                  '.main',
                  '.main-content',
                  '.content',
                  '#content',
                  // 博客文章相关
                  '.article',
                  '.article-content',
                  '.post',
                  '.post-content',
                  '.entry',
                  '.entry-content',
                  '.blog-post',
                  '.blog-content',
                  // 新闻文章相关
                  '.news-content',
                  '.news-article',
                  '.story-content',
                  // 文档相关
                  '.document',
                  '.doc-content',
                  '.page-content',
                  // 其他常见容器
                  '.container',
                  '.wrapper',
                  '.page',
                  '.page-wrapper',
                ];

                // 移除不需要的元素的选择器
                const removeSelectors = [
                  'script',
                  'style',
                  'iframe',
                  'nav',
                  'header',
                  'footer',
                  '.ad',
                  '.ads',
                  '.advertisement',
                  '.comment',
                  '.comments',
                  '.sidebar',
                  '.menu',
                  '.navigation',
                  '.social-share',
                  '.related-posts',
                  '.recommend',
                  '.recommendation',
                  '.popup',
                  '.modal',
                  '.cookie-notice',
                  '.newsletter',
                  '.subscribe',
                  '.share',
                  '.social',
                  '.banner',
                  '.promo',
                  '.sponsored',
                  '.advertisement',
                  '.widget',
                  '.widget-area',
                  '.sidebar-widget',
                  '.footer-widget',
                ];

                // 处理内容，保持图片位置
                const processContent = (element: HTMLElement) => {
                  const clone = element.cloneNode(true) as HTMLElement;

                  // 移除不需要的元素
                  removeSelectors.forEach(selector => {
                    const elements = clone.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                  });

                  // 处理所有图片
                  const images = clone.querySelectorAll('img');
                  images.forEach(img => {
                    const imgInfo = {
                      src: img.src, // 浏览器会将此解析为绝对URL
                      alt: img.alt || '',
                      title: img.title || '',
                    };
                    // 将图片替换为Markdown格式
                    const placeholder = document.createElement('span');
                    placeholder.textContent = `![${imgInfo.alt}](${
                      imgInfo.src
                    }${imgInfo.title ? ` "${imgInfo.title}"` : ''})`;
                    img.parentNode?.replaceChild(placeholder, img);
                  });

                  // 获取处理后的文本
                  return clone.innerText
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();
                };

                // 遍历选择器查找内容
                for (const selector of selectors) {
                  const element = document.querySelector(selector);
                  if (element && element instanceof HTMLElement) {
                    const text = processContent(element);
                    // 如果内容太少，可能不是主要内容
                    if (text.length > 100) {
                      return text;
                    }
                  }
                }

                // 如果没找到合适的内容，尝试获取body内容
                return processContent(document.body);
              });

              // 如果内容为空或太短，尝试重试
              if (!content || content.length < 50) {
                await page.waitForTimeout(200);
                content = await page.evaluate(() => {
                  const processContent = (element: HTMLElement) => {
                    const clone = element.cloneNode(true) as HTMLElement;

                    // 处理所有图片
                    const images = clone.querySelectorAll('img');
                    images.forEach(img => {
                      const imgInfo = {
                        src: img.src, // 浏览器会将此解析为绝对URL
                        alt: img.alt || '',
                        title: img.title || '',
                      };
                      // 将图片替换为Markdown格式
                      const placeholder = document.createElement('span');
                      placeholder.textContent = `![${imgInfo.alt}](${
                        imgInfo.src
                      }${imgInfo.title ? ` "${imgInfo.title}"` : ''})`;
                      img.parentNode?.replaceChild(placeholder, img);
                    });

                    return clone.innerText
                      .replace(/\s+/g, ' ')
                      .replace(/\n\s*\n/g, '\n')
                      .trim();
                  };

                  return processContent(document.body);
                });
              }
            }
          } catch (error) {
            console.error('获取内容失败:', error);
            // 尝试最后的备用方案
            try {
              content = await page.evaluate(() => {
                return document.body.innerText
                  .replace(/\s+/g, ' ')
                  .replace(/\n\s*\n/g, '\n')
                  .trim();
              });
            } catch (fallbackError) {
              console.error('备用方案也失败:', fallbackError);
              content = '无法获取内容';
            }
          }

          // 新增逻辑：处理提取内容中的图片链接
          if (
            content &&
            content !== '无法获取内容' &&
            uploadPlugin &&
            typeof uploadPlugin.downAndUpload === 'function' &&
            opts.downloadImages
          ) {
            // 更新正则表达式，匹配更广泛的图片格式，包括相对路径
            const imageRegex = /!\[(.*?)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g;
            const matches = [];
            let match;

            const rootUrl = getRootUrl(request.loadedUrl);
            const pageUrl = request.loadedUrl;

            // 收集所有图片占位符信息
            while ((match = imageRegex.exec(content)) !== null) {
              let imageUrl = match[2].trim();

              // 检查是否为base64图片
              if (imageUrl.startsWith('data:image/')) {
                // 对于base64图片，直接保留原样
                // matches.push({
                //   index: match.index,
                //   length: match[0].length,
                //   originalPlaceholder: match[0],
                //   imageAlt: match[1] || '',
                //   imageUrl: imageUrl,
                //   imageTitle: match[3] || '',
                //   isBase64: true, // 标记为base64图片
                // });
                continue;
              }

              // 处理相对路径转为绝对路径
              if (
                !imageUrl.startsWith('http://') &&
                !imageUrl.startsWith('https://')
              ) {
                if (imageUrl.startsWith('/')) {
                  // 以根路径开头
                  imageUrl = `${rootUrl}${imageUrl}`;
                } else {
                  // 相对于当前页面的路径
                  const baseUrl = pageUrl.substring(
                    0,
                    pageUrl.lastIndexOf('/') + 1
                  );
                  imageUrl = `${baseUrl}${imageUrl}`;
                }
              }

              matches.push({
                index: match.index,
                length: match[0].length,
                originalPlaceholder: match[0],
                imageAlt: match[1] || '', // 图片alt文本
                imageUrl: imageUrl, // 处理后的完整图片URL
                imageTitle: match[3] || '', // 图片title (可选)
                isBase64: false, // 标记为非base64图片
              });
            }

            if (matches.length > 0) {
              // 并行处理所有图片下载和URL替换
              const replacementPromises = matches.map(async m => {
                // 对于base64图片，直接返回原始占位符
                if (m.isBase64) {
                  return `![${m.imageAlt}](${m.imageUrl}${
                    m.imageTitle ? ` "${m.imageTitle}"` : ''
                  })`;
                }

                try {
                  // 提取文件扩展名
                  let fileExt = 'png'; // 修改默认扩展名为png

                  // 有效的图片扩展名列表
                  const validImageExts = [
                    'jpg',
                    'jpeg',
                    'png',
                    'gif',
                    'webp',
                    'svg',
                    'bmp',
                    'ico',
                    'tiff',
                    'avif',
                  ];

                  // 尝试从URL路径中提取扩展名（排除查询参数）
                  const urlPath = m.imageUrl.split('?')[0];
                  // 只有当URL路径中包含扩展名时才提取
                  if (urlPath.includes('.')) {
                    const ext = urlPath.split('.').pop();
                    // 确保扩展名有效且是图片扩展名
                    if (ext && /^[a-zA-Z0-9]+$/.test(ext) && ext.length < 10) {
                      const lowerExt = ext.toLowerCase();
                      // 如果是有效的图片扩展名，则使用它，否则使用默认的png
                      if (validImageExts.includes(lowerExt)) {
                        fileExt = lowerExt;
                      }
                    }
                  }

                  // 生成带扩展名的文件名
                  const filename = `${uuidv4()}.${fileExt}`;

                  const newImageUrl = await uploadPlugin.downAndUpload(
                    m.imageUrl,
                    filename
                  );
                  return `![${m.imageAlt}](${newImageUrl}${
                    m.imageTitle ? ` "${m.imageTitle}"` : ''
                  })`;
                } catch (uploadError) {
                  console.error(`图片下载失败: ${m.imageUrl}`, uploadError);
                  // 下载失败，返回使用原始URL的占位符
                  return `![${m.imageAlt}](${m.imageUrl}${
                    m.imageTitle ? ` "${m.imageTitle}"` : ''
                  })`;
                }
              });

              const replacements = await Promise.all(replacementPromises);

              // 重建content字符串，替换图片占位符
              let newProcessedContent = '';
              let lastIndex = 0;
              for (let i = 0; i < matches.length; i++) {
                newProcessedContent += content.substring(
                  lastIndex,
                  matches[i].index
                ); // 添加图片前的文本
                newProcessedContent += replacements[i]; // 添加处理后的图片占位符
                lastIndex = matches[i].index + matches[i].length; // 更新下一个起始索引
              }
              newProcessedContent += content.substring(lastIndex); // 添加最后一个图片后的文本
              content = newProcessedContent; // 更新content变量
            }
          } else if (
            uploadPlugin &&
            typeof uploadPlugin.downAndUpload !== 'function'
          ) {
            console.warn(
              'Upload plugin实例存在，但downAndUpload方法未找到，无法处理图片。'
            );
          } else if (!uploadPlugin) {
            console.warn('Upload plugin未初始化，无法处理图片。');
          }
          // 新增逻辑结束

          result.push({
            title,
            url: request.loadedUrl,
            content: `根地址：${getRootUrl(request.loadedUrl)}\n\n${content}`,
          });
        } catch (error) {
          console.error('页面加载失败:', error);
          result.push({
            title: '加载失败',
            url: request.loadedUrl,
            content: '无法加载页面',
          });
        }
      },
      maxConcurrency: 10,
      maxRequestsPerCrawl: 100,
      respectRobotsTxtFile: false,
      retryOnBlocked: false,
      useSessionPool: true,
      persistCookiesPerSession: false,
      navigationTimeoutSecs: 10000,
      headless: true,
      launchContext: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    // 添加起始URL并启动爬虫
    await requestQueue.addRequest({ url: link });
    await crawler.run();

    // 配置Turndown服务，生成更清爽的Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx', // 使用#风格的标题
      hr: '---', // 水平分割线使用---
      bulletListMarker: '-', // 无序列表使用-
      codeBlockStyle: 'fenced', // 使用```代码块
      emDelimiter: '_', // 斜体使用_
      strongDelimiter: '**', // 粗体使用**
      linkStyle: 'inlined', // 内联链接样式
      linkReferenceStyle: 'full', // 完整链接引用样式
    });

    // 额外规则配置
    turndownService.addRule('removeExcessiveLineBreaks', {
      filter: ['p', 'div', 'li'],
      replacement: function (content) {
        return '\n\n' + content.trim() + '\n\n';
      },
    });

    // 保留一些有用的HTML元素
    turndownService.keep(['kbd', 'mark']);

    // 清理空白符
    turndownService.addRule('cleanWhitespace', {
      filter: function () {
        return true; // 应用于所有元素
      },
      replacement: function (content) {
        // 将多个空行减少为最多两个空行
        return content.replace(/\n{3,}/g, '\n\n');
      },
    });

    return result.map(d => ({
      pageContent: opts.isMd ? turndownService.turndown(d.content) : d.content,
      metadata: {
        title: d.title,
        url: d.url,
      },
    }));
  }

  /**
   * 爬取网站并返回同一域名下的所有URL及其标题
   * @param {string} url - 网站地址
   * @param {Function} callback - 接收每个URL和标题的回调函数
   */
  async parseUrl(
    url: string,
    callback: (data: { url: string; title: string }) => void
  ) {
    // 创建一个集合来存储唯一的URL
    const uniqueUrls = new Set();

    // 从输入URL中提取域名
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // 创建一个唯一的请求队列
    const requestQueue = await RequestQueue.open(
      `queue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    );
    // 创建爬虫实例
    let crawler = new PlaywrightCrawler({
      requestQueue,
      // 处理请求的函数
      async requestHandler({ request, page, enqueueLinks }) {
        // 如果不是来自同一域名则跳过
        const currentUrlObj = new URL(request.url);
        if (currentUrlObj.hostname !== domain) {
          return;
        }

        // 获取当前URL（去除hash部分）
        const currentUrl = request.url.split('#')[0];

        // 如果已经处理过则跳过
        if (uniqueUrls.has(currentUrl)) {
          return;
        }

        // 添加到唯一URL集合中
        uniqueUrls.add(currentUrl);

        // 获取页面标题
        const title = await page.title();

        // 调用回调函数，传入URL和标题
        callback({
          url: currentUrl,
          title: title,
        });

        // 将页面上的所有符合条件的链接加入队列
        await enqueueLinks({
          strategy: 'same-origin',
          transformRequestFunction: req => {
            // 移除URL中的hash部分
            req.url = req.url.split('#')[0];
            return req;
          },
          // 排除静态资源
          exclude: [
            /\.(jpg|jpeg|png|gif|svg|webp|css|js|json|xml|woff|woff2|ttf|eot|mp4|webm|ogg|mp3|wav|pdf|doc|docx|xls|xlsx|zip|rar|tar|gz)$/i,
          ],
        });
      },
      // 最大并发请求数
      maxConcurrency: 10,
      // 最大爬取深度
      maxRequestsPerCrawl: 100,
      // 尊重robots.txt文件
      respectRobotsTxtFile: true,
      // 重试被阻止的请求
      retryOnBlocked: false,
      // 确保每次爬取完成后清理资源
      useSessionPool: true,
      // 是否持久化cookies
      persistCookiesPerSession: false,
      // 导航超时时间
      navigationTimeoutSecs: 10000,
      statisticsOptions: {
        persistenceOptions: {
          enable: false,
        },
      },
    });
    // 添加起始URL并启动爬虫
    await requestQueue.addRequest({ url });
    await crawler.run();
  }
}
