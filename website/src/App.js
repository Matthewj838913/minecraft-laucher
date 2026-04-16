import React, { useState } from 'react';

function App() {
  const [showDownload, setShowDownload] = useState(false);

  const downloadLauncher = () => {
    window.location.href = '/Minecraft Star Launcher-1.0.0.AppImage';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 starry-bg opacity-30 pointer-events-none"></div>
      
      <nav className="relative z-10 bg-white/20 backdrop-blur-xl p-6 shadow-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Minecraft Star Launcher 🚀
          </h1>
          <button
            onClick={() => setShowDownload(!showDownload)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg"
          >
            {showDownload ? 'Hide' : 'Download'}
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto p-8 pt-0">
        <section className="text-center mb-20">
          <h2 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-6">
            Launch Your Stars
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Cosmic Minecraft launcher with mods, servers, offline/cracked/online support. One-click everything.
          </p>
          
          {showDownload && (
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl max-w-md mx-auto mb-8">
              <h3 className="text-2xl font-bold mb-4">Download Launcher</h3>
              <p className="text-white/70 mb-6">Linux AppImage (v1.0.0) - Works on Ubuntu, Debian, etc.</p>
              <button
                onClick={downloadLauncher}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 p-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl mb-2"
              >
                📥 Download AppImage (~100MB)
              </button>
              <p className="text-xs text-white/50 mt-2 text-center">Run `chmod +x` then `./Minecraft Star Launcher-1.0.0.AppImage`</p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-white/20 px-4 py-2 rounded-full">Offline Mode</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Cracked Support</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Lunar/Badlion Mods</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Server Hosting</span>
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">⭐ Mods</h3>
            <ul className="space-y-2 text-white/80">
              <li>• Lunar Client Pack</li>
              <li>• Badlion Client</li>
              <li>• Fabric/Forge Loader</li>
              <li>• Modrinth/CurseForge</li>
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">🌐 Servers</h3>
            <p className="text-white/80">One-click Java server creation/hosting.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl md:col-span-2 lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4">⚡ Fast</h3>
            <p className="text-white/80">Electron + native Java integration.</p>
          </div>
        </section>

        <section className="text-center">
          <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Ready to Launch?
          </h3>
          <button
            onClick={downloadLauncher}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl"
          >
            Get Started Now
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;

