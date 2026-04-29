import { Outlet, useOutletContext } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import GlobalChat from '@/components/GlobalChat'
import { useState } from 'react'

export default function Layout() {
  const [lang, setLang] = useState('he')
  const [search, setSearch] = useState('')

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar lang={lang} setLang={setLang}/>
      <main style={{ flex:1, overflowY:'auto', background:'#F9F7F4' }}>
        <Outlet context={{ lang, setLang, search, setSearch }}/>
      </main>
      {/* Global AI Chat — appears on all screens */}
      <GlobalChat/>
    </div>
  )
}  