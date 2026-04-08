'use client'

import { Settings, Palette, Type, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useTheme } from '@/lib/theme-context'
import { DIALECTS, Dialect } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLES = [
  { id: 'traditional', name: '傳統風格', description: '簡潔方正的傳統美學' },
  { id: 'modern', name: '現代風格', description: '圓潤親切的現代設計' },
  { id: 'playful', name: '活潑風格', description: '大圓角的趣味風格' },
] as const

const DIALECT_COLORS: Record<Dialect, { primary: string, accent: string }> = {
  sixian: { primary: 'bg-teal-600', accent: 'bg-amber-500' },
  hailu: { primary: 'bg-emerald-600', accent: 'bg-orange-500' },
  dapu: { primary: 'bg-rose-600', accent: 'bg-pink-500' },
  raoping: { primary: 'bg-amber-600', accent: 'bg-yellow-500' },
  zhaoan: { primary: 'bg-indigo-600', accent: 'bg-violet-500' },
  sihai: { primary: 'bg-sky-600', accent: 'bg-cyan-500' },
}

export function ThemeCustomizer() {
  const { dialect, style, setDialect, setStyle } = useTheme()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-background hover:bg-muted"
        >
          <Settings className="h-6 w-6" />
          <span className="sr-only">主題設定</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            入口頁設定
          </SheetTitle>
          <SheetDescription>
            自訂首頁主題風格，選擇您喜愛的腔調和美術風格
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 py-6">
          {/* Dialect Theme */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">腔調主題</Label>
            </div>
            <RadioGroup
              value={dialect}
              onValueChange={(value) => setDialect(value as any)}
              className="grid grid-cols-2 gap-3"
            >
              {DIALECTS.map((d) => {
                const colors = DIALECT_COLORS[d.id]
                return (
                  <Label
                    key={d.id}
                    htmlFor={d.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      dialect === d.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value={d.id} id={d.id} className="sr-only" />
                    <div className="flex gap-1">
                      <div className={cn('w-4 h-4 rounded-full', colors.primary)} />
                      <div className={cn('w-4 h-4 rounded-full', colors.accent)} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.nameEn}</p>
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>
          </div>

          {/* Art Style */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">美術風格</Label>
            </div>
            <RadioGroup
              value={style}
              onValueChange={(value) => setStyle(value as any)}
              className="space-y-3"
            >
              {STYLES.map((s) => (
                <Label
                  key={s.id}
                  htmlFor={s.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    style === s.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={s.id} id={s.id} className="sr-only" />
                  <div
                    className={cn(
                      'w-12 h-12 bg-primary flex items-center justify-center text-primary-foreground font-bold',
                      s.id === 'traditional' && 'rounded-sm',
                      s.id === 'modern' && 'rounded-lg',
                      s.id === 'playful' && 'rounded-2xl'
                    )}
                  >
                    客
                  </div>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Preview */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                預覽效果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full">主要按鈕</Button>
                <Button variant="secondary" className="w-full">次要按鈕</Button>
                <Button variant="outline" className="w-full">邊框按鈕</Button>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 rounded-full bg-primary" />
                  <div className="flex-1 h-2 rounded-full bg-accent" />
                  <div className="flex-1 h-2 rounded-full bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">快速功能</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                語料檢索
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                斷詞標注
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                詞彙剖析
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                語言資源
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}