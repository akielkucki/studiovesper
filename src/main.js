import { mount } from 'svelte'
import '@fontsource-variable/mona-sans/wdth.css'
import '@fontsource-variable/geist-mono'
import 'lenis/dist/lenis.css'
import './app.css'
import App from './App.svelte'

const app = mount(App, { target: document.getElementById('app') })

export default app
