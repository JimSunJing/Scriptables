//
// mastodon for scriptables
// author:JimSunJing
// 项目地址：https://github.com/JimSunJing/Scriptables
// 功能说明：使用 mastodon 的站点公开api，查看最新/特别关注用户/话题最新嘟文
// 参数列表：
// mastodon@latest:domain (default)
// mastodon@latest:domain^userid (specific user)
// mastodon@latest:domain#hashtag (default)
// 

class Im3xWidget {
  /**
   * 初始化
   * @param arg 外部传递过来的参数
   */
  constructor(_arg, loader) {
    // 默认使用长毛象中文站点
    if (!_arg) _arg = "cmx-im.work"
    this.loader = loader
    this.fileName = module.filename.split('Documents/')[1]
    this.widgetSize = config.widgetFamily
    // console.log(_arg)
    // 判断需要显示哪些内容
    if (_arg.indexOf('#') !== -1) {
      this.domain = _arg.split('#')[0]
      this.arg = encodeURI(_arg.split('#')[1])
      this.type = 'hashtag'
    } else if (_arg.indexOf('^') !== -1) {
      this.domain = _arg.split('^')[0]
      const u = _arg.split('^')[1]
      console.log(u)
      if (!Number.isInteger(Number(u))) {
        this.type = null
      } else {
        this.arg = u
        this.type = 'user'
      }
    } else {
      this.domain = _arg
      this.type = null
    }
  }

  getTextFromHtml(html) {
    let reg=/<\/?.+?\/?>/g
    return html.replace(reg, '')
  }

  /**
   * 渲染组件
   */
  async render() {
    if (this.widgetSize === 'medium') {
      return await this.renderMedium()
    } else if (this.widgetSize === 'large') {
      return await this.renderLarge()
    } else {
      return await this.renderSmall()
    }
  }

  async renderErr(widget) {
    let err = widget.addText("💔 加载失败，稍后重试..")
    err.textColor = Color.red()
    err.centerAlignText()
    return widget
  }

  /**
   * 渲染小尺寸组件
   */
  async renderSmall() {
    let w = new ListWidget()

    let data = await this.getAPI()
    let toot = data[0]

    // 这个应该是定义点击小组件时跳转的链接？
    if (!toot) return await this.renderErr(w)
    w.url = this.loader ? this.getURIScheme('open-url', {
      url: toot['url']
    }) : toot['url']
    w = await this.renderHeader(w)
    let content = w.addText(this.getTextFromHtml(toot['content']))
    content.font = Font.lightSystemFont(16)
    content.textColor = Color.white()
    content.lineLimit = 3

    w.backgroundImage = await this.shadowImage(await this.getImage(toot['account']['avatar']))

    w.addSpacer(10)
    let footer = w.addText(`@${toot['account']['display_name']} / ${toot['created_at'].split('T')[1].slice(0, 8)}`)
    footer.font = Font.lightSystemFont(10)
    footer.textColor = Color.white()
    footer.textOpacity = 0.5
    footer.lineLimit = 1
    return w
  }
  /**
   * 渲染中尺寸组件
   */
  async renderMedium() {
    let w = new ListWidget()
    let data = await this.getAPI()
    w.addSpacer(10)
    w = await this.renderHeader(w, false)
    for (let i = 0; i < 2; i++) {
      w = await this.renderToot(w, data[i])
      w.addSpacer(5)
    }
    return w
  }
  /**
   * 渲染大尺寸组件
   */
  async renderLarge() {
    let w = new ListWidget()
    let data = await this.getAPI()
    w.addSpacer(10)
    w = await this.renderHeader(w, false)
    for (let i = 0; i < 5; i++) {
      w = await this.renderToot(w, data[i])
      w.addSpacer(5)
    }
    return w
  }

  /**
 * 用户传递的组件自定义点击操作
 */
  async runActions() {
    let { act, data } = this.parseQuery()
    if (!act) return
  }

  // 获取跳转自身 urlscheme
  // w.url = this.getURIScheme("copy", "data-to-copy")
  getURIScheme (act, data) {
    let _raw = typeof data === 'object' ? JSON.stringify(data) : data
    let _data = Data.fromString(_raw)
    let _b64 = _data.toBase64String()
    return `scriptable:///run?scriptName=${encodeURIComponent(Script.name())}&act=${act}&data=${_b64}&__widget__=${encodeURIComponent(args['widgetParameter'])}`
  }
  // 解析 urlscheme 参数
  // { act: "copy", data: "copy" }
  parseQuery() {
    const { act, data } = args['queryParameters']
    if (!act) return { act }
    let _data = Data.fromBase64String(data)
    let _raw = _data.toRawString()
    let result = _raw
    try {
      result = JSON.parse(_raw)
    } catch (e) { }
    return {
      act,
      data: result
    }
  }

  /**
   * 渲染标题
   * @param widget 组件对象
   * @param icon 图标url地址
   * @param title 标题
   */
  async renderHeader(widget, darkBg) {
    let icon = await this.getImage(`https://${this.domain}/favicon.ico`)
    let title = "Mastodon·" + this.domain

    let header = widget.addStack()
    header.centerAlignContent()
    let _icon = header.addImage(icon)
    _icon.imageSize = new Size(14, 14)
    _icon.cornerRadius = 4
    header.addSpacer(10)
    let _title = header.addText(title)
    if (darkBg) _title.textColor = Color.white()
    _title.textOpacity = 0.7
    _title.font = Font.boldSystemFont(12)
    widget.addSpacer(15)
    return widget
  }

  async renderToot(widget, toot) {
    let body = widget.addStack()
    if (!toot) return await this.renderErr(w)
    body.url = this.loader ? this.getURIScheme('open-url', {
      url: toot['url']
    }) : toot['url']

    let left = body.addStack()
    let avatar = left.addImage(await this.getImage(toot['account']['avatar']))
    avatar.imageSize = new Size(35, 35)
    avatar.cornerRadius = 5

    body.addSpacer(10)

    let right = body.addStack()
    right.layoutVertically()
    let content = right.addText(this.getTextFromHtml(toot['content']))
    content.font = Font.lightSystemFont(14)
    content.lineLimit = 2

    right.addSpacer(5)
    
    const timeStr = (toot['created_at']+' GMT')
    const time =new Date(Date(timeStr))
    
    let formatter = new DateFormatter()
    formatter.dateFormat = 'MM-dd HH:mm'

    let info = right.addText(`@${toot['account']['display_name']} / ${formatter.string(time)}`)
    info.font = Font.lightSystemFont(10)
    info.textOpacity = 0.6
    info.lineLimit = 2

    widget.addSpacer(10)

    return widget
  }

  async getAPI() {
    let api
    if (!this.type) {
      api = `https://${this.domain}/api/v1/timelines/public?limit=5`
    } else if (this.type === 'hashtag') {
      api = `https://${this.domain}/api/v1/timelines/tag/${this.arg}?limit=5`
    } else if (this.type === 'user') {
      api = `https://${this.domain}/api/v1/accounts/${this.arg}/statuses?limit=5`
    }
    let data = await this.getData(api)
    return data
  }

  /**
   * 获取api数据
   * @param api api地址
   * @param json 接口数据是否是 json 格式，如果不是（纯text)，则传递 false
   * @return 数据 || null
   */
  async getData(api, json = true) {
    let data = null
    const cacheKey = `${this.fileName}_cache`
    try {
      let req = new Request(api)
      data = await (json ? req.loadJSON() : req.loadString())
    } catch (e) { }
    // 判断数据是否为空（加载失败）
    if (!data) {
      // 判断是否有缓存
      if (Keychain.contains(cacheKey)) {
        let cache = Keychain.get(cacheKey)
        return json ? JSON.parse(cache) : cache
      } else {
        // 刷新
        return null
      }
    }
    // 存储缓存
    Keychain.set(cacheKey, json ? JSON.stringify(data) : data)
    return data
  }

  /**
   * 加载远程图片
   * @param url string 图片地址
   * @return image
   */
  async getImage(url) {
    try {
      let req = new Request(url)
      return await req.loadImage()
    } catch (e) {
      let ctx = new DrawContext()
      ctx.size = new Size(100, 100)
      ctx.setFillColor(Color.red())
      ctx.fillRect(new Rect(0, 0, 100, 100))
      return await ctx.getImage()
    }
  }

  /**
   * 给图片加上半透明遮罩
   * @param img 要处理的图片对象
   * @return image
   */
  async shadowImage(img) {
    let ctx = new DrawContext()
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    // 图片遮罩颜色、透明度设置
    ctx.setFillColor(new Color("#000000", 0.7))
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    let res = await ctx.getImage()
    return res
  }

  /**
   * 编辑测试使用
   */
  async test() {
    if (config.runsInWidget) return
    this.widgetSize = 'small'
    let w1 = await this.render()
    await w1.presentSmall()
    this.widgetSize = 'medium'
    let w2 = await this.render()
    await w2.presentMedium()
    this.widgetSize = 'large'
    let w3 = await this.render()
    await w3.presentLarge()
  }

  /**
   * 组件单独在桌面运行时调用
   */
  async init() {
    if (!config.runsInWidget) return await this.runActions()
    let widget = await this.render()
    Script.setWidget(widget)
    Script.complete()
  }
}

module.exports = Im3xWidget

// 如果是在编辑器内编辑、运行、测试，则取消注释这行，便于调试：
// await new Im3xWidget('').test()

// 如果是组件单独使用（桌面配置选择这个组件使用，则取消注释这一行：
// await new Im3xWidget(args.widgetParameter, true).init()