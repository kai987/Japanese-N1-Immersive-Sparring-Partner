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
