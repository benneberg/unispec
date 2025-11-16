
import React from 'react';
import { type WineRegionInfo } from '../types';

interface RegionInfoCardProps {
  data: WineRegionInfo;
  regionName: string;
}

const InfoSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <h3 className="text-xl font-semibold text-[#6B3E26] flex items-center mb-3">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        {children}
    </div>
);

const GrapeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C9.24 2 7 4.24 7 7c0 2.25 1.45 4.15 3.42 4.79c-1.33.24-2.58.8-3.62 1.62C3.43 15.7 2 19.36 2 22h2c0-3.31 2.69-6 6-6s6 2.69 6 6h2c0-2.64-1.43-6.3-4.8-8.59c-1.04-.82-2.29-1.38-3.62-1.62C15.55 11.15 17 9.25 17 7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3z"/>
    </svg>
);

const WineryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.69l5 4.5V19h-3v-4H10v4H7V10.19l5-4.5z"/>
    </svg>
);


const RegionInfoCard: React.FC<RegionInfoCardProps> = ({ data, regionName }) => {
  return (
    <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-6 md:p-8 border border-stone-200 animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-6 text-[#8C3B3B]">{regionName}</h2>
      
      <div className="space-y-6">
        <div>
          <p className="text-[#4A2C2A] leading-relaxed text-justify">{data.description}</p>
        </div>

        <div className="border-t border-stone-200 pt-6">
            <InfoSection title="Key Grape Varieties" icon={<GrapeIcon className="h-6 w-6" />}>
                <div className="flex flex-wrap gap-2">
                    {data.grapes.map((grape) => (
                        <span key={grape} className="px-3 py-1 bg-[#8C3B3B]/10 text-[#8C3B3B] rounded-full text-sm font-medium">
                            {grape}
                        </span>
                    ))}
                </div>
            </InfoSection>
        </div>

        <div className="border-t border-stone-200 pt-6">
            <InfoSection title="Notable Wineries" icon={<WineryIcon className="h-6 w-6" />}>
                 <ul className="list-disc list-inside space-y-2 text-[#4A2C2A]">
                    {data.wineries.map((winery) => (
                        <li key={winery}>{winery}</li>
                    ))}
                </ul>
            </InfoSection>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RegionInfoCard;
