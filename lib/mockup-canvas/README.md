# Mockup Canvas Rendering

Esta carpeta contiene los renderizadores de mockups para exportación de video en Canvas 2D.

## Estructura

```
mockup-canvas/
├── index.ts              # Exportaciones principales
├── types.ts              # Tipos compartidos (MockupCanvasContext, MockupDrawResult)
├── shared.ts             # Utilidades compartidas (drawRoundedRectPath, drawMockupShadow)
├── macos.ts              # Mockup de macOS estándar
├── macos-glass.ts        # Mockup de macOS con efecto glass border
├── vscode.ts             # Mockup de VS Code
└── iphone-slim.ts        # Mockup de iPhone Slim
```

## Agregar un nuevo mockup

1. **Crear archivo** `lib/mockup-canvas/tu-mockup.ts`:

```typescript
import { hexToRgba } from "@/lib/utils";
import type { MockupCanvasContext, MockupDrawResult } from "./types";
import { drawRoundedRectPath, drawMockupShadow } from "./shared";

export function drawTuMockup(context: MockupCanvasContext): MockupDrawResult {
    const { ctx, x, y, width, height, config, cornerRadius, shadowBlur } = context;
    
    // Tu lógica de renderizado aquí
    
    return {
        contentX: x,
        contentY: y + headerHeight,
        contentWidth: width,
        contentHeight: height - headerHeight,
    };
}
```

2. **Exportar** en `lib/mockup-canvas/index.ts`:

```typescript
export { drawTuMockup } from './tu-mockup';
```

3. **Registrar** en `lib/mockup-canvas.utils.ts`:

```typescript
import { drawTuMockup } from "./mockup-canvas";

// En la función drawMockupToCanvas:
case "tu-mockup":
    return drawTuMockup(context);
```

4. **Agregar datos** en `lib/mockupData.tsx`:

```typescript
{
    id: "tu-mockup",
    name: "Tu Mockup",
    category: "browser",
    features: {
        hasDarkMode: true,
        // ... otras features
    },
    preview: <TuMockupPreview />
}
```

## Consideraciones importantes

### Border Radius
- **Mockups sin padding extra** (macos, vscode): El radio se aplica solo a esquinas superiores en el header, y esquinas inferiores en el contenido
- **Mockups con glass border** (macos-glass): El radio exterior es el original, el radio interior se calcula restando el padding: `innerRadius = cornerRadius - glassPadding`
- **Mockups móviles** (iphone-slim): Usan radios más grandes para simular la pantalla curva

### Sombras
- Usar `drawMockupShadow()` para dibujar sombras sin bloquear el fondo transparente
- La sombra se dibuja con un stroke casi transparente: `rgba(0, 0, 0, 0.01)`

### Transparencia del header
- Usar `hexToRgba(frameColor, headerOpacity)` para aplicar transparencia al header
- La barra de búsqueda/URL debe usar `deriveSearchBg(frameColor)` con la misma opacidad

### Escalado proporcional
- Todos los valores deben escalar con `headerScale = (config.headerScale || 100) / 100`
- Mantener proporciones relativas entre elementos (botones, iconos, texto)
