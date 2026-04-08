'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Download, 
  Layers, 
  LayoutGrid, 
  Eye, 
  Settings2,
  Info,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { WordSketchViz } from '@/components/admin/word-sketch-viz'
import { cn } from '@/lib/utils'

// 模擬 Word Sketch 完整數據
const SKETCH_DATA = {
  Modifies: [
    { word: '文化節', score: 12.4, freq: 850 },
    { word: '族群', score: 11.2, freq: 620 },
    { word: '鄉親', score: 10.8, freq: 450 },
    { word: '山歌', score: 10.5, freq: 380 },
    { word: '博物館', score: 10.1, freq: 310 },
    { word: '歌謠', score: 9.8, freq: 280 },
    { word: '美食', score: 9.5, freq: 240 },
  ],
  N_Modifier: [
    { word: '榮興', score: 11.8, freq: 750 },
    { word: '美濃', score: 11.5, freq: 720 },
    { word: '寶島', score: 10.2, freq: 510 },
    { word: '永定', score: 9.9, freq: 420 },
    { word: '全美', score: 9.4, freq: 380 },
    { word: '中原', score: 9.1, freq: 310 },
  ],
  Subject_of: [
    { word: '採茶', score: 13.2, freq: 1200 },
    { word: '小炒', score: 12.8, freq: 1100 },
    { word: '醃漬', score: 11.5, freq: 850 },
    { word: '講古', score: 10.9, freq: 620 },
    { word: '現身', score: 10.4, freq: 580 },
    { word: '說唱', score: 9.9, freq: 450 },
  ],
  Object_of: [
    { word: '品嚐', score: 14.1, freq: 1500 },
    { word: '發揚', score: 13.5, freq: 1400 },
    { word: '演唱', score: 12.2, freq: 1100 },
    { word: '保存', score: 11.8, freq: 950 },
    { word: '認識', score: 11.1, freq: 820 },
    { word: '變成', score: 10.5, freq: 710 },
  ],
  Possession: [
    { word: '夜', score: 8.5, freq: 120 },
    { word: '情', score: 8.2, freq: 110 },
  ]
}

export default function WordSketchPage() {
  const [viewMode, setViewMode] = useState<'list' | 'viz'>('list')
  const [keyword, setKeyword] = useState('客家')
  const [collocateCount, setCollocateCount] = useState([13])
  const [activeRelations, setActiveRelations] = useState({
    Modifies: true,
    N_Modifier: true,
    Subject_of: true,
    Object_of: true,
    Possession: false,
    Measure: false,
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Top Search Bar & Header */}
      <div className="bg-white p-4 border-b -mx-8 -mt-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="text-xl font-bold text-hakka-navy whitespace-nowrap">WORD SKETCH</div>
          <div className="relative max-w-md w-full">
            <Input 
              value="Chinese GigaWord 2 Corpus: Taiwan, traditional"
              readOnly
              className="bg-muted/50 border-none pr-10 text-xs"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-1 px-3">
            {keyword} as 12,126x
          </Badge>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground"><Search className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><Download className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><Eye className="h-5 w-5" /></Button>
          <Button 
            variant={viewMode === 'viz' ? 'default' : 'outline'}
            className={cn(
              "gap-2 rounded-lg transition-all",
              viewMode === 'viz' ? "bg-hakka-navy text-white shadow-lg" : ""
            )}
            onClick={() => setViewMode(viewMode === 'list' ? 'viz' : 'list')}
          >
            {viewMode === 'list' ? (
              <><Layers className="h-4 w-4" /> Show visualization</>
            ) : (
              <><LayoutGrid className="h-4 w-4" /> Show list</>
            )}
          </Button>
        </div>
      </div>

      <div className="text-sm text-primary font-medium bg-primary/5 p-4 rounded-xl border border-primary/10">
        {viewMode === 'list' 
          ? "Word Sketch 功能會顯示關鍵詞在句子裡作為修飾語、主語、賓語時所搭配的共現詞"
          : "此功能會將 Word Sketch 的查詢結果以視覺化方式呈現，共現次數較高的詞氣泡會較大"}
      </div>

      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1">
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {Object.entries(SKETCH_DATA).map(([relation, words]) => (
                <Card key={relation} className="border-none shadow-sm overflow-hidden h-fit">
                  <CardHeader className="bg-muted/30 p-3 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-center w-full">{relation}</CardTitle>
                    <div className="flex gap-1">
                      <LayoutGrid className="h-3 w-3 text-muted-foreground" />
                      <Settings2 className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {words.map((w, i) => (
                        <div key={i} className="p-3 hover:bg-muted/20 cursor-pointer flex justify-between items-center group">
                          <div>
                            <div className="font-bold text-sm">{w.word}</div>
                            <div className="text-[10px] text-muted-foreground">{keyword} {w.word}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border shadow-sm p-8 min-h-[600px] flex items-center justify-center relative overflow-hidden">
              <WordSketchViz 
                data={Object.entries(SKETCH_DATA)
                  .filter(([rel]) => activeRelations[rel as keyof typeof activeRelations])
                  .flatMap(([rel, words]) => words.map(w => ({ ...w, relation: rel })))} 
                centralWord={keyword}
              />
            </div>
          )}
        </div>

        {/* Sidebar Controls (Only shown in Viz Mode) */}
        {viewMode === 'viz' && (
          <aside className="w-80 space-y-6 animate-in slide-in-from-right duration-300">
            <Card className="border-none shadow-sm sticky top-24">
              <CardContent className="p-6 space-y-8">
                {/* Count Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-muted-foreground">Number of collocates ({collocateCount})</label>
                  </div>
                  <Slider 
                    value={collocateCount} 
                    onValueChange={setCollocateCount} 
                    max={50} 
                    min={1} 
                    step={1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                    <span>Fewer</span>
                    <span>More</span>
                  </div>
                </div>

                {/* Relation Toggles */}
                <div className="space-y-4 pt-4 border-t">
                  {Object.keys(activeRelations).map((rel) => (
                    <div key={rel} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-hakka-navy">{rel}</span>
                      <Switch 
                        checked={activeRelations[rel as keyof typeof activeRelations]} 
                        onCheckedChange={(checked) => 
                          setActiveRelations(prev => ({ ...prev, [rel]: checked }))
                        }
                      />
                    </div>
                  ))}
                  <div className="flex justify-center pt-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full bg-hakka-navy hover:bg-hakka-navy/90 gap-2 h-11 shadow-lg">
                  <Download className="h-4 w-4" /> DOWNLOAD IMAGE
                </Button>
              </CardContent>
            </Card>
          </aside>
        )}
      </div>
    </div>
  )
}

function ChevronDown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}