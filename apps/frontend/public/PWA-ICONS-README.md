# PWA Icons Setup

Para gerar os ícones PWA necessários, use uma ferramenta online ou crie imagens com as seguintes dimensões:

## Ícones Necessários:

1. **pwa-192x192.png** - 192x192px
   - Ícone principal para Android/Chrome
   - Fundo: #10B981 (verde Mivra)
   - Logo: Letra "M" branca centralizada

2. **pwa-512x512.png** - 512x512px
   - Ícone de alta resolução
   - Mesmo design do 192x192

3. **apple-touch-icon.png** - 180x180px
   - Ícone específico para iOS/Safari
   - Cantos arredondados aplicados automaticamente pelo iOS

4. **favicon.ico** - 32x32px ou 16x16px
   - Favicon tradicional do navegador

## Ferramentas Recomendadas:

- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- Figma/Photoshop/Illustrator

## Design Sugerido:

```
Cor de fundo: #10B981 (Verde primário)
Letra "M": #FFFFFF (Branco)
Font: Oxanium Bold
```

## Após criar os ícones:

1. Substitua os arquivos placeholder na pasta `/public`
2. Execute `npm run build` para gerar a build PWA
3. Teste em dispositivos reais ou Chrome DevTools

## Verificar PWA:

```bash
npm run build
npm run preview
```

Abra Chrome DevTools → Application → Manifest para verificar os ícones.
