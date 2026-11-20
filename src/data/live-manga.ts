export interface LiveMangaPage {
  id: string
  file: string
  label: string
  alt: string
  width: number
  height: number
  originalFilename: string
}

export interface LiveMangaGallery {
  id: string
  title: string
  description: string
  pages: LiveMangaPage[]
}

// User-supplied originals, kept byte-for-byte. Page numbers are printed in the
// images; the title image has no visible page number. Both study units cover
// this story, so share the gallery rather than invent a broadcast-page boundary.
export const tanpopoManga: LiveMangaGallery = {
  id: 'tanpopo-sora-wo-iku',
  title: 'タンポポ空を行く',
  description: '10月29日与10月30日学习同一短篇，共用这16张漫画原图。顺序为标题页、图片标示的第29—43页；标题页未标页码。可逐页对照笔记，点击图片或“打开原图”查看原始尺寸。',
  pages: [
    { id: 'cover', file: 'tanpopo-sora-wo-iku/cover.jpg', label: '标题页', alt: '「タンポポ空を行く」标题页：哆啦A梦、大雄与蒲公英', width: 1352, height: 1920, originalFilename: 'IMG_3378.JPG' },
    { id: 'page-029', file: 'tanpopo-sora-wo-iku/page-029.jpg', label: '第29页', alt: '「タンポポ空を行く」第29页：大雄准备丢掉蒲公英', width: 1352, height: 1920, originalFilename: 'IMG_3379.JPG' },
    { id: 'page-030', file: 'tanpopo-sora-wo-iku/page-030.jpg', label: '第30页', alt: '「タンポポ空を行く」第30页：戴上ファンタグラス看见蒲公英的表情', width: 1352, height: 1920, originalFilename: 'IMG_3380.JPG' },
    { id: 'page-031', file: 'tanpopo-sora-wo-iku/page-031.jpg', label: '第31页', alt: '「タンポポ空を行く」第31页：给蒲公英移栽、浇水', width: 1352, height: 1920, originalFilename: 'IMG_3381.JPG' },
    { id: 'page-032', file: 'tanpopo-sora-wo-iku/page-032.jpg', label: '第32页', alt: '「タンポポ空を行く」第32页：大雄听到植物口渴并主动浇水', width: 1352, height: 1920, originalFilename: 'IMG_3382.JPG' },
    { id: 'page-033', file: 'tanpopo-sora-wo-iku/page-033.jpg', label: '第33页', alt: '「タンポポ空を行く」第33页：蚂蚁为冬天做准备', width: 1352, height: 1920, originalFilename: 'IMG_3383.JPG' },
    { id: 'page-034', file: 'tanpopo-sora-wo-iku/page-034.jpg', label: '第34页', alt: '「タンポポ空を行く」第34页：蒲公英鼓励大雄面对不擅长的棒球', width: 1352, height: 1920, originalFilename: 'IMG_3384.JPG' },
    { id: 'page-035', file: 'tanpopo-sora-wo-iku/page-035.jpg', label: '第35页', alt: '「タンポポ空を行く」第35页：大雄在大风中保护蒲公英', width: 1352, height: 1920, originalFilename: 'IMG_3385.JPG' },
    { id: 'page-036', file: 'tanpopo-sora-wo-iku/page-036.jpg', label: '第36页', alt: '「タンポポ空を行く」第36页：蒲公英开花并感谢大雄', width: 1352, height: 1920, originalFilename: 'IMG_3386.JPG' },
    { id: 'page-037', file: 'tanpopo-sora-wo-iku/page-037.jpg', label: '第37页', alt: '「タンポポ空を行く」第37页：大雄犹豫要不要参加棒球', width: 1352, height: 1920, originalFilename: 'IMG_3387.JPG' },
    { id: 'page-038', file: 'tanpopo-sora-wo-iku/page-038.jpg', label: '第38页', alt: '「タンポポ空を行く」第38页：蒲公英种子准备出发', width: 1352, height: 1920, originalFilename: 'IMG_3388.JPG' },
    { id: 'page-039', file: 'tanpopo-sora-wo-iku/page-039.jpg', label: '第39页', alt: '「タンポポ空を行く」第39页：大雄听到蒲公英母子的夜间谈话', width: 1352, height: 1920, originalFilename: 'IMG_3389.JPG' },
    { id: 'page-040', file: 'tanpopo-sora-wo-iku/page-040.jpg', label: '第40页', alt: '「タンポポ空を行く」第40页：蒲公英母亲回忆乘风与列车旅行', width: 1352, height: 1920, originalFilename: 'IMG_3390.JPG' },
    { id: 'page-041', file: 'tanpopo-sora-wo-iku/page-041.jpg', label: '第41页', alt: '「タンポポ空を行く」第41页：蒲公英母亲讲述来到大雄家的经历', width: 1352, height: 1920, originalFilename: 'IMG_3391.JPG' },
    { id: 'page-042', file: 'tanpopo-sora-wo-iku/page-042.jpg', label: '第42页', alt: '「タンポポ空を行く」第42页：最后一粒种子出发，大雄追了出去', width: 1352, height: 1920, originalFilename: 'IMG_3392.JPG' },
    { id: 'page-043', file: 'tanpopo-sora-wo-iku/page-043.jpg', label: '第43页', alt: '「タンポポ空を行く」第43页：大雄为种子加油，并主动参加棒球', width: 1352, height: 1920, originalFilename: 'IMG_3393.JPG' },
  ],
}

// The supplied title page and printed pp.116–124 belong to the same story.
// 11/09 studies its first part; 11/13 continues it before moving to おそだアメ.
// Keep one shared set of original image bytes and do not infer a page split.
export const otoshimonoManga: LiveMangaGallery = {
  id: 'otoshimono-comeback-spray',
  title: '落としものカムバックスプレー',
  description: '11月9日与11月13日前半学习同一短篇，共用这10张漫画原图。顺序为标题页、图片标示的第116—124页；标题页未标页码。本组图片仅对应「落としものカムバックスプレー」，不包含11月13日后半的「おそだアメ」。可逐页对照笔记，点击图片或“打开原图”查看原始尺寸。',
  pages: [
    { id: 'cover', file: 'otoshimono-comeback-spray/otoshimono-cover.jpg', label: '标题页', alt: '「落としものカムバックスプレー」标题页：哆啦A梦、大雄与飞回来的物品', width: 1352, height: 1920, originalFilename: 'IMG_3396(1).JPG' },
    { id: 'page-116', file: 'otoshimono-comeback-spray/page-116.jpg', label: '第116页', alt: '「落としものカムバックスプレー」第116页：大雄发现漫画被妈妈当作垃圾扔掉', width: 1352, height: 1920, originalFilename: 'IMG_3397(1).JPG' },
    { id: 'page-117', file: 'otoshimono-comeback-spray/page-117.jpg', label: '第117页', alt: '「落としものカムバックスプレー」第117页：大雄向哆啦A梦求助，被扔掉的漫画飞了回来', width: 1352, height: 1920, originalFilename: 'IMG_3398(1).JPG' },
    { id: 'page-118', file: 'otoshimono-comeback-spray/page-118.jpg', label: '第118页', alt: '「落としものカムバックスプレー」第118页：哆啦A梦说明喷雾的作用，用球做实验', width: 1352, height: 1920, originalFilename: 'IMG_3399(1).JPG' },
    { id: 'page-119', file: 'otoshimono-comeback-spray/page-119.jpg', label: '第119页', alt: '「落としものカムバックスプレー」第119页：大雄给自己的物品和妈妈的购物篮喷上喷雾', width: 1352, height: 1920, originalFilename: 'IMG_3400(1).JPG' },
    { id: 'page-120', file: 'otoshimono-comeback-spray/page-120.jpg', label: '第120页', alt: '「落としものカムバックスプレー」第120页：大雄和静香到小夫家做客', width: 1352, height: 1920, originalFilename: 'IMG_3401(1).JPG' },
    { id: 'page-121', file: 'otoshimono-comeback-spray/page-121.jpg', label: '第121页', alt: '「落としものカムバックスプレー」第121页：大家观看小夫一家去露营的家庭录像', width: 1352, height: 1920, originalFilename: 'IMG_3402(1).JPG' },
    { id: 'page-122', file: 'otoshimono-comeback-spray/page-122.jpg', label: '第122页', alt: '「落としものカムバックスプレー」第122页：大雄和哆啦A梦在露营地遇见捡垃圾的人', width: 1352, height: 1920, originalFilename: 'IMG_3403(1).JPG' },
    { id: 'page-123', file: 'otoshimono-comeback-spray/page-123.jpg', label: '第123页', alt: '「落としものカムバックスプレー」第123页：给露营地的垃圾喷上喷雾，回家途中遇见丢失物品的妈妈', width: 1352, height: 1920, originalFilename: 'IMG_3404(1).JPG' },
    { id: 'page-124', file: 'otoshimono-comeback-spray/page-124.jpg', label: '第124页', alt: '「落としものカムバックスプレー」第124页：妈妈的物品回到家中，露营地的垃圾也回到小夫家', width: 1352, height: 1920, originalFilename: 'IMG_3405(1).JPG' },
  ],
}

// The first supplied page includes the title and opening panels (printed p.290).
// The ending follows p.297, but its image has no visible printed page number.
export const osodaManga: LiveMangaGallery = {
  id: 'osoda-ame',
  title: 'おそだアメ',
  description: '对应11月13日后半学习的「おそだアメ」，共9张漫画原图。按图片顺序收录第290—297页和末页；第290页含篇名与故事开头，最后一张未显示页码。可逐页对照笔记，点击图片或“打开原图”查看原始尺寸。',
  pages: [
    { id: 'page-290', file: 'osoda-ame/page-290.jpg', label: '第290页（标题与开头）', alt: '「おそだアメ」第290页：篇名与故事开头，大雄回家寻找约好比瞪眼的哆啦A梦', width: 1352, height: 1920, originalFilename: 'IMG_3406.JPG' },
    { id: 'page-291', file: 'osoda-ame/page-291.jpg', label: '第291页', alt: '「おそだアメ」第291页：大雄听见哆啦A梦留下的声音，却找不到他', width: 1352, height: 1920, originalFilename: 'IMG_3407.JPG' },
    { id: 'page-292', file: 'osoda-ame/page-292.jpg', label: '第292页', alt: '「おそだアメ」第292页：大雄与静香谈起胖虎的演唱会', width: 1352, height: 1920, originalFilename: 'IMG_3408.JPG' },
    { id: 'page-293', file: 'osoda-ame/page-293.jpg', label: '第293页', alt: '「おそだアメ」第293页：大雄向哆啦A梦求助，哆啦A梦介绍延迟声音传播的糖果', width: 1352, height: 1920, originalFilename: 'IMG_3409.JPG' },
    { id: 'page-294', file: 'osoda-ame/page-294.jpg', label: '第294页', alt: '「おそだアメ」第294页：用糖果做实验，声音过了一段时间才传来', width: 1352, height: 1920, originalFilename: 'IMG_3410.JPG' },
    { id: 'page-295', file: 'osoda-ame/page-295.jpg', label: '第295页', alt: '「おそだアメ」第295页：妈妈唱歌时，大雄先前说的话延迟传来', width: 1352, height: 1920, originalFilename: 'IMG_3411.JPG' },
    { id: 'page-296', file: 'osoda-ame/page-296.jpg', label: '第296页', alt: '「おそだアメ」第296页：演唱会当天，大雄和哆啦A梦把糖果交给胖虎', width: 1352, height: 1920, originalFilename: 'IMG_3412.JPG' },
    { id: 'page-297', file: 'osoda-ame/page-297.jpg', label: '第297页', alt: '「おそだアメ」第297页：胖虎吃下全部糖果，大家听完无声的演唱会', width: 1352, height: 1920, originalFilename: 'IMG_3413.JPG' },
    { id: 'ending', file: 'osoda-ame/osoda-ending.jpg', label: '末页（未标页码）', alt: '「おそだアメ」末页：延迟的歌声在深夜响起，邻居们准备抗议；图片未显示页码', width: 1352, height: 1920, originalFilename: 'IMG_3414.JPG' },
  ],
}
