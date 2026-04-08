'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LAYER1_DATA, LAYER2_DATA, LAYER3_DATA } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const [layer, setLayer] = useState<1 | 2 | 3>(1)
  const [selectedWord, setSelectedWord] = useState('美食')
  const [keyword] = useState('客家')

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-[#333]">
      {/* Header - 依照圖一/二的深綠色背景設計 */}
      <header className="bg-[#2d4d4d] text-white py-3 px-6 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white rounded-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none">臺灣客語語料庫</span>
              <span className="text-[10px] opacity-70">Taiwan Hakka Corpus</span>
            </div>
          </Link>

          <div className="flex-1 max-w-2xl flex items-center gap-0">
            <div className="relative flex-1">
              <Input 
                value={layer === 1 ? keyword : `${keyword},${selectedWord}`}
                readOnly
                className="bg-white text-gray-900 h-10 rounded-l-md rounded-r-none border-0 focus-visible:ring-0"
              />
              {layer === 2 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
              )}
            </div>
            <Button className="bg-[#4d6b6b] hover:bg-[#3d5b5b] h-10 px-5 rounded-l-none rounded-r-md">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex border border-white/30 rounded-md overflow-hidden text-sm h-10">
            <button className="px-4 bg-white text-[#2d4d4d] font-bold">關鍵詞</button>
            <button className="px-4 bg-[#4d6b6b] hover:bg-[#3d5b5b] transition-colors">共現詞</button>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 p-6">
        {/* Sidebar - 完全參考三張圖左側欄位 */}
        <aside className="w-64 space-y-6 shrink-0">
          <div className="bg-white p-6 border rounded-sm shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-sm border-l-4 border-[#009688] pl-2">每頁顯示筆數</h3>
              <div className="flex border rounded-md overflow-hidden text-xs">
                <button className="flex-1 py-2 bg-white border-r hover:bg-gray-50">15</button>
                <button className="flex-1 py-2 bg-white border-r hover:bg-gray-50">30</button>
                <button className="flex-1 py-2 bg-white hover:bg-gray-50">50</button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm border-l-4 border-[#009688] pl-2">跨距</h3>
              <div className="flex gap-2">
                <Input placeholder="可複選" className="text-xs h-8 border-gray-200 flex-1" />
                <Button className="bg-[#2196f3] hover:bg-[#1976d2] h-8 text-xs rounded-sm px-4">確定</Button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-bold text-sm border-l-4 border-[#009688] pl-2">腔調</h3>
              <div className="space-y-4 text-xs">
                {[
                  { name: '四縣腔', count: 194 },
                  { name: '海陸腔', count: 93 },
                  { name: '南四縣腔', count: 45 },
                  { name: '大埔腔', count: 41 },
                  { name: '饒平腔', count: 39 },
                ].map((d) => (
                  <div key={d.name} className="flex justify-between items-center text-[#2196f3] hover:underline cursor-pointer group">
                    <span>{d.name}</span>
                    <span className="text-gray-400 group-hover:text-gray-600">({d.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {layer === 1 && (
            <div className="bg-white border rounded-sm shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-[#f9fafb]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>共現詞</TableHead>
                    <TableHead className="w-48">總符合筆數</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LAYER1_DATA.map((item, i) => (
                    <TableRow key={i} className="group">
                      <TableCell className="text-gray-400 text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => { setLayer(2); setSelectedWord(item.word); }}
                          className="text-[#2196f3] hover:underline font-medium"
                        >
                          {item.word}
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">{item.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {layer === 2 && (
            <div className="bg-white border rounded-sm shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-[#f9fafb]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>共現詞</TableHead>
                    <TableHead>關鍵詞</TableHead>
                    <TableHead>共現詞</TableHead>
                    <TableHead className="text-center">跨距</TableHead>
                    <TableHead className="text-right">互見訊息值</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LAYER2_DATA.map((item, i) => (
                    <TableRow 
                      key={i} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setLayer(3)}
                    >
                      <TableCell className="text-gray-400 text-xs">{i + 1}</TableCell>
                      <TableCell className="text-[#2196f3]">{item.word1}</TableCell>
                      <TableCell>{item.keyword}</TableCell>
                      <TableCell className="text-[#2196f3]">{item.word2}</TableCell>
                      <TableCell className="text-center font-medium">{item.span}</TableCell>
                      <TableCell className="text-right font-medium">{item.miScore.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t flex items-center justify-center gap-4 text-xs">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0">{ "<" }</Button>
                <span className="flex items-center gap-1">
                  <span className="w-7 h-7 border border-[#2196f3] text-[#2196f3] flex items-center justify-center rounded-sm">1</span>
                </span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0">{ ">" }</Button>
                <div className="flex items-center gap-2 ml-4">
                  <span>跳至</span>
                  <Input className="w-10 h-7 p-1 text-center" defaultValue="1" />
                  <span>頁</span>
                  <Button variant="outline" size="sm" className="h-7 px-3">前往</Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Layer 3 Modal - 完全參考圖三的對話框設計 */}
      {layer === 3 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6">
          <div className="bg-white w-full max-w-6xl rounded-sm shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4 text-sm">
                <div className="bg-[#e3f2fd] text-[#2196f3] px-3 py-1 rounded-sm flex items-center gap-2 border border-[#bbdefb]">
                  <span className="font-bold">次數：61</span>
                </div>
                <div className="text-gray-400 text-xs">
                  點擊欲查看的語料可查看該筆語料的詳細資訊
                </div>
              </div>
              <button onClick={() => setLayer(2)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <Table className="text-sm">
                <TableHeader className="bg-[#f9fafb] sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">腔調</TableHead>
                    <TableHead className="text-right pr-8">前文</TableHead>
                    <TableHead className="text-center w-24">關鍵詞</TableHead>
                    <TableHead className="pl-8">後文</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LAYER3_DATA.map((item, i) => (
                    <TableRow key={i} className="hover:bg-gray-50 group cursor-pointer">
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-6 h-6 border text-[#2196f3] rounded-sm text-xs font-bold bg-white">
                          {item.dialect}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-8 text-gray-500 font-serif">{item.left}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-[#f44336] font-bold">{item.keyword}</span>
                      </TableCell>
                      <TableCell className="pl-8 text-gray-700 font-serif">
                        {item.right.split(' ').map((word, idx) => (
                          <span key={idx} className={word === '美食' ? 'text-[#2196f3] font-bold mx-1' : ''}>
                            {word}{' '}
                          </span>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">載入中...</div>}>
      <SearchResultsContent />
    </Suspense>
  )
}