import tailwind from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwind({
      config: './tailwind.config.js'
    }),
    autoprefixer(),
  ],
}
