import { useEffect, useRef, useState } from "react"
import { Canvas as FabricCanvas, Circle, Rect, Triangle, Textbox, Image as FabricImage } from "fabric"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MousePointer, 
  Square, 
  Circle as CircleIcon, 
  Triangle as TriangleIcon,
  Type,
  Palette,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Copy,
  Move,
  Pencil
} from "lucide-react"
import { toast } from "sonner"

type Tool = "select" | "rectangle" | "circle" | "triangle" | "text" | "draw"

export const CanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [activeColor, setActiveColor] = useState("#6366f1")
  const [strokeWidth, setStrokeWidth] = useState(2)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    })

    // Initialize drawing brush
    canvas.freeDrawingBrush.color = activeColor
    canvas.freeDrawingBrush.width = strokeWidth

    setFabricCanvas(canvas)
    toast.success("Canvas editor ready!")

    return () => {
      canvas.dispose()
    }
  }, [])

  useEffect(() => {
    if (!fabricCanvas) return

    fabricCanvas.isDrawingMode = activeTool === "draw"
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor
      fabricCanvas.freeDrawingBrush.width = strokeWidth
    }
  }, [activeTool, activeColor, strokeWidth, fabricCanvas])

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool)

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 120,
        height: 80,
        stroke: activeColor,
        strokeWidth: 1,
      })
      fabricCanvas?.add(rect)
      fabricCanvas?.setActiveObject(rect)
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: activeColor,
        radius: 50,
        stroke: activeColor,
        strokeWidth: 1,
      })
      fabricCanvas?.add(circle)
      fabricCanvas?.setActiveObject(circle)
    } else if (tool === "triangle") {
      const triangle = new Triangle({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 100,
        stroke: activeColor,
        strokeWidth: 1,
      })
      fabricCanvas?.add(triangle)
      fabricCanvas?.setActiveObject(triangle)
    } else if (tool === "text") {
      const text = new Textbox("Click to edit text", {
        left: 100,
        top: 100,
        fontFamily: "Inter",
        fontSize: 24,
        fill: activeColor,
        width: 200,
      })
      fabricCanvas?.add(text)
      fabricCanvas?.setActiveObject(text)
    }

    fabricCanvas?.renderAll()
  }

  const handleClear = () => {
    if (!fabricCanvas) return
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = "#ffffff"
    fabricCanvas.renderAll()
    toast.info("Canvas cleared!")
  }

  const handleDelete = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      fabricCanvas.remove(activeObject)
      fabricCanvas.renderAll()
      toast.info("Object deleted!")
    }
  }

  const handleCopy = async () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      try {
        const cloned = await activeObject.clone()
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20,
        })
        fabricCanvas.add(cloned)
        fabricCanvas.setActiveObject(cloned)
        fabricCanvas.renderAll()
        toast.info("Object copied!")
      } catch (error) {
        console.error('Error copying object:', error)
        toast.error("Failed to copy object")
      }
    }
  }

  const handleDownload = () => {
    if (!fabricCanvas) return
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    })
    
    const link = document.createElement('a')
    link.download = 'canvas-design.png'
    link.href = dataURL
    link.click()
    toast.success("Canvas downloaded!")
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !fabricCanvas) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const imgElement = new Image()
      imgElement.onload = () => {
        const fabricImage = new FabricImage(imgElement, {
          left: 50,
          top: 50,
          scaleX: 0.5,
          scaleY: 0.5,
        })
        fabricCanvas.add(fabricImage)
        fabricCanvas.renderAll()
        toast.success("Image uploaded!")
      }
      imgElement.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: CircleIcon, label: "Circle" },
    { id: "triangle", icon: TriangleIcon, label: "Triangle" },
    { id: "text", icon: Type, label: "Text" },
    { id: "draw", icon: Pencil, label: "Draw" },
  ] as const

  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", 
    "#f59e0b", "#10b981", "#06b6d4", "#6b7280",
    "#000000", "#ffffff"
  ]

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Tools */}
            <div className="flex items-center gap-2">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleToolSelect(tool.id as Tool)}
                  title={tool.label}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Colors */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Color:</Label>
              <div className="flex items-center gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 ${
                      activeColor === color ? "border-primary" : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setActiveColor(color)}
                    title={color}
                  />
                ))}
                <Input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="w-8 h-6 p-0 border-0"
                />
              </div>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Brush Width */}
            {activeTool === "draw" && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Width:</Label>
                  <Input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-20"
                  />
                  <Badge variant="outline">{strokeWidth}px</Badge>
                </div>
                <Separator orientation="vertical" className="h-8" />
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </label>
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleClear}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              
              <Button variant="default" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center">
            <div className="border border-border rounded-lg overflow-hidden shadow-gallery">
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Instructions:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Select tools from the toolbar to create shapes and text</li>
              <li>• Use the draw tool for freehand drawing</li>
              <li>• Upload images to add them to your canvas</li>
              <li>• Select objects to move, resize, or modify them</li>
              <li>• Change colors using the color palette or color picker</li>
              <li>• Download your creation as a PNG image</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}