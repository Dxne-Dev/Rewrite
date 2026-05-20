import { Video } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-900 mt-12 py-16 px-6 text-center">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-sm text-neutral-500">
        <p className="flex items-center gap-2 justify-center">
          Créé avec <span className="text-purple-600">passion</span> pour les lecteur(trices).
        </p>

        <div className="flex items-center gap-6 mt-2">
          <a href="#" className="hover:text-purple-400 transition-colors flex items-center gap-2">
            <svg 
              viewBox="0 0 24 24" 
              className="w-4 h-4 fill-current"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.33 13.916c-.201.272-.455.513-.756.702-.451.282-.977.432-1.52.432-1.127 0-2.023-.746-2.5-1.921l-.039-.102c-.546.852-1.42 1.353-2.433 1.353-1.439 0-2.613-1.1-2.613-2.584 0-1.48 1.174-2.583 2.613-2.583.918 0 1.722.41 2.227 1.096v-.717h1.498v4.293c0 .543.181.871.554.871.218 0 .438-.113.626-.328.188-.216.29-.49.29-.757v-.935c0-2.316-1.558-4.047-4.148-4.047-2.646 0-4.333 1.764-4.333 4.417s1.687 4.414 4.333 4.414c1.267 0 2.378-.387 3.303-1.152l.93 1.157c-1.196 1.025-2.682 1.551-4.233 1.551-4.329 0-7.318-2.883-7.318-7.318s2.989-7.319 7.318-7.319c4.103 0 7.142 2.668 7.142 6.947v1.179c0 .762-.315 1.488-.887 2.041zm-6.763-1.614c.642 0 1.191-.497 1.191-1.157s-.549-1.157-1.191-1.157-1.191.497-1.191 1.157.549 1.157 1.191 1.157z" />
            </svg>
            <span>Threads</span>
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors flex items-center gap-2">
            <svg 
              viewBox="0 0 24 24" 
              className="w-4 h-4 fill-current"
            >
              <path d="M12.53.02C13.84 0 15.14.01 16.44 0c-.08 1.53.61 2.89 1.76 3.75 1.05.79 2.37 1.15 3.68 1.25V9c-1.84-.04-3.56-.7-4.88-1.98-.1.41-.12.83-.12 1.25v6.52c-.08 2.26-1.53 4.29-3.7 4.88-2.6 1.05-5.69-.26-6.57-2.92-.88-2.6.49-5.59 3.09-6.32 1.01-.28 2.1-.15 3.03.35V5.55C12.72 4.1 12.63 2.6 12.53.02z" />
            </svg>
            <span>TikTok</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
