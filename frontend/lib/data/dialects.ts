/**
 * 六腔靜態 metadata — 補充 lib/types.ts DIALECTS 的文化資訊
 * 資料來源：行政院客委會 / 語言平等法資料
 */

import { Dialect } from '@/lib/types'

export interface DialectInfo {
  intro: string
  populationEst: number       // 慣用人口估計數
  mainRegions: string[]       // 主要分布縣市
  historyNote: string         // 一句歷史背景
}

export const DIALECT_INFO: Record<Dialect, DialectInfo> = {
  sixian: {
    intro: '四縣腔是客語中使用人口最多的腔調，以苗栗縣為大本營，北延桃竹、南伸屏東六堆及臺東縱谷。音調平實、語速偏慢，保留許多古漢語入聲韻尾。',
    populationEst: 580000,
    mainRegions: ['苗栗', '桃園中壢', '屏東六堆', '臺東縱谷'],
    historyNote: '清康熙年間由廣東梅州、蕉嶺一帶移民攜入臺灣。',
  },
  hailu: {
    intro: '海陸腔源自廣東海豐、陸豐，分布以新竹縣市及桃園新屋為核心，以強調聲調（8個聲調）著稱，語音尖銳明亮，被稱為「客語中的普通話」。',
    populationEst: 260000,
    mainRegions: ['新竹', '桃園新屋', '花蓮鳳林'],
    historyNote: '廣東海豐、陸豐移民清代渡海來臺，主要聚居竹塹（今新竹）一帶。',
  },
  dapu: {
    intro: '大埔腔源自廣東大埔縣，分布集中於臺中東勢及苗栗卓蘭，以溫軟流暢著稱，保留較多中古漢語音韻特徵，被語言學家視為研究古漢語的重要活化石。',
    populationEst: 25000,
    mainRegions: ['臺中東勢', '苗栗卓蘭'],
    historyNote: '源自廣東大埔縣的客家人，清中期渡臺定居於大甲溪流域。',
  },
  raoping: {
    intro: '饒平腔源自廣東饒平縣，散居桃竹苗及彰化員林，音韻介於四縣與潮州話之間，使用人口分散，被列為「瀕危方言」優先保護對象。',
    populationEst: 15000,
    mainRegions: ['新竹竹北', '彰化員林', '桃園龜山'],
    historyNote: '廣東饒平縣客家人清代散居於閩南人聚落周邊，逐漸式微。',
  },
  zhaoan: {
    intro: '詔安腔源自福建詔安縣，受閩南語影響最深，音調接近閩南話，主要分布於雲林崙背及二崙，使用人口極少，為臺灣最瀕危客語腔調之一。',
    populationEst: 8000,
    mainRegions: ['雲林崙背', '雲林二崙'],
    historyNote: '清代福建詔安縣客家人移居臺灣西南沿海，與閩南人長期混居融合。',
  },
  sihai: {
    intro: '四海腔（南四縣腔）是四縣腔的南部變體，分布於桃園中壢南部及花蓮玉里一帶，與四縣腔互通但聲調略有差異，近年受客委會語言政策積極推廣。',
    populationEst: 80000,
    mainRegions: ['桃園', '花蓮玉里'],
    historyNote: '源自四縣腔在南遷過程中的語音演變，為客語六腔中較年輕的分類。',
  },
}
