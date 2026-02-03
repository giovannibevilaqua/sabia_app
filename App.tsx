
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ComposedChart, Area
} from 'recharts';
import { 
  LayoutDashboardIcon, MessageSquareIcon, TrendingUpIcon, UsersIcon, WalletIcon, 
  PercentIcon, BriefcaseIcon, CreditCardIcon, ChartAreaIcon,
  SparklesIcon, Loader2Icon, UploadCloudIcon,
  SettingsIcon, GlobeIcon, RefreshCcwIcon, XIcon, InfoIcon, AlertCircleIcon,
  CalendarIcon, BrainCircuitIcon, LinkIcon, MapIcon, MapPinnedIcon, FileTextIcon, DatabaseIcon, CpuIcon, UserCheckIcon, ArrowUpIcon, ArrowDownIcon,
  FilterIcon,
  MenuIcon
} from 'lucide-react';

import { FilterState, TomadorRow, EstoqueRow, ConcessaoRow, AggregatedData } from './types';
import { COLORS, PORTE_COLORS, REGIOES, UFS, UF_MAP } from './constants';
import { generateMockData } from './utils/dataGenerator';
import { 
  processCreditData, formatCurrency, formatPercent, formatQuarter, 
  getBreakdown, formatNumberBR, calculateForecast, getRegionalSeries, getUFTableData 
} from './utils/dataProcessor';
import { parseBacenExcel } from './utils/excelParser';
import StatCard from './components/StatCard';
import FilterPanel from './components/FilterPanel';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const [loadingFile, setLoadingFile] = useState(false);
  const [dataSource, setDataSource] = useState<'mock' | 'excel'>('mock');
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Link Dropbox padrão fornecido pelo usuário
  const defaultUrl = "https://www.dropbox.com/scl/fi/jm5wkss3whkd9gpolsmql/base_bacen_sebrae.xlsx?rlkey=tjczut5u06mg9mbipwdygbrte&dl=0";
  const [remoteUrl, setRemoteUrl] = useState(localStorage.getItem('sabia_data_url') || defaultUrl);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    porte: [], sexo: [], regiao: [], uf: [], origem: [], modalidade: []
  });

  const initialMock = useMemo(() => generateMockData(), []);
  const [rawRows, setRawRows] = useState<{
    tomadores: TomadorRow[],
    estoques: EstoqueRow[],
    concessoes: ConcessaoRow[]
  }>(initialMock);

  useEffect(() => {
    if (remoteUrl) {
      loadFromUrl(remoteUrl);
    }
  }, []);

  const availableModalidades = useMemo(() => {
    const mods = new Set<string>();
    rawRows.estoques.forEach(e => { if(e.MODALIDADE) mods.add(e.MODALIDADE); });
    rawRows.concessoes.forEach(c => { if(c.MODALIDADE) mods.add(c.MODALIDADE); });
    return Array.from(mods).filter(Boolean).sort();
  }, [rawRows]);

  const loadFromUrl = async (url: string) => {
    if (!url) return;
    setLoadingFile(true);
    setSyncError(null);
    try {
      const directUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('dl=0', 'dl=1');
      const response = await fetch(directUrl);
      if (!response.ok) throw new Error("Conexão falhou.");
      const buffer = await response.arrayBuffer();
      const parsedData = await parseBacenExcel(buffer);
      setRawRows(parsedData);
      setDataSource('excel');
      localStorage.setItem('sabia_data_url', url);
      setShowSettings(false);
    } catch (error) {
      setSyncError("Não foi possível carregar os dados. Verifique o link.");
    } finally {
      setLoadingFile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingFile(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsedData = await parseBacenExcel(buffer);
      setRawRows(parsedData);
      setDataSource('excel');
    } catch (error) {
      alert("Erro ao processar arquivo.");
    } finally {
      setLoadingFile(false);
    }
  };

  const processedData = useMemo(() => {
    return processCreditData(rawRows.tomadores, rawRows.estoques, rawRows.concessoes, filters);
  }, [rawRows, filters]);

  const latestIdx = processedData.length - 1;
  const latest = latestIdx >= 0 ? processedData[latestIdx] : null;
  const previous = latestIdx >= 1 ? processedData[latestIdx - 1] : latest;
  const yearAgo = latestIdx >= 4 ? processedData[latestIdx - 4] : latest;

  const getTrend = (curr: number | undefined, prev: number | undefined) => {
    if (!prev || !curr) return 0;
    return ((curr - prev) / prev) * 100;
  };

  const KPISec = ({ title, dataKey, icon, color, formatVal, isInteger = false }: any) => {
    const breakdownLatest = useMemo(() => {
      return getBreakdown(dataKey as any, rawRows.tomadores, rawRows.estoques, rawRows.concessoes, filters, 'latest', latest?.quarter);
    }, [dataKey, filters, latest, rawRows]);

    const renderCustomBarLabel = (props: any) => {
      const { x, y, width, height, value } = props;
      const formattedValue = isInteger ? formatNumberBR(value, 0) : formatVal(value);
      return <text x={x + width + 8} y={y + height / 2} fill="#000" textAnchor="start" dominantBaseline="middle" className="text-[10px] font-black">{formattedValue}</text>;
    };

    return (
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-10">
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-slate-100" style={{ color }}>{icon}</div>
            <h3 className="font-black text-black tracking-tight text-lg uppercase">{title}</h3>
          </div>
          <div className="hidden sm:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-[2px] bg-slate-300 border-t border-dashed" style={{ borderColor: color }}></div>
              <span className="text-[10px] font-black uppercase text-slate-400">Média Móvel (3p)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-[4px] rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-[10px] font-black uppercase text-slate-400">Indicador Real</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12">
          <div className="xl:col-span-7 p-4 md:p-8 border-r border-slate-100">
            <div className="h-[280px] md:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="quarter" tickFormatter={formatQuarter} stroke="#000" fontSize={11} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#000" 
                    fontSize={11} 
                    fontWeight="black" 
                    tickFormatter={(v) => formatVal(v)} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'black' }}
                    labelFormatter={formatQuarter} 
                    formatter={(v: number, name: string) => [formatVal(v), name]} 
                  />
                  <Line name="Valor Real" type="monotone" dataKey={dataKey} stroke={color} strokeWidth={4} dot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} animationDuration={1000} />
                  <Line name="Média Móvel (3p)" type="monotone" dataKey={`movingAverage.${dataKey}`} stroke={color} strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={0.5} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="xl:col-span-5 p-8 bg-slate-50/30 flex flex-col justify-around">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Distribuição por Porte</h4>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={breakdownLatest.porte} margin={{ right: 100 }}>
                    <XAxis type="number" hide domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={70} fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(v: number) => [isInteger ? formatNumberBR(v, 0) : formatVal(v), 'Total']} />
                    <Bar name="Total" dataKey="value" barSize={14} label={renderCustomBarLabel} radius={[0, 4, 4, 0]}>
                      {breakdownLatest.porte.map((entry, index) => <Cell key={index} fill={PORTE_COLORS[entry.name] || COLORS.neutral} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Distribuição por Sexo</h4>
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={breakdownLatest.sexo} margin={{ right: 100 }}>
                    <XAxis type="number" hide domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={70} fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(v: number) => [isInteger ? formatNumberBR(v, 0) : formatVal(v), 'Total']} />
                    <Bar name="Total" dataKey="value" barSize={14} label={renderCustomBarLabel} radius={[0, 4, 4, 0]}>
                      {breakdownLatest.sexo.map((entry, index) => <Cell key={index} fill={entry.name === 'Feminino' ? '#f472b6' : '#60a5fa'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ForecastSection = ({ title, dataKey, formatVal }: any) => {
    const forecastData = useMemo(() => calculateForecast(processedData, dataKey, 4), [processedData, dataKey]);
    
    const tooltipFormatter = (value: any, name: string) => {
      if (name === 'Previsão Central' || name === 'Limite Superior' || name === 'Limite Inferior') {
        return [formatVal(value), name];
      }
      return null;
    };

    return (
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-10">
        <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500 rounded-lg text-white"><BrainCircuitIcon size={20} /></div>
            <h3 className="font-black text-white tracking-tight text-lg uppercase">Previsão: {title}</h3>
          </div>
        </div>
        <div className="p-4 md:p-8 h-[280px] md:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tickFormatter={formatQuarter} stroke="#000" fontSize={11} fontWeight="black" dy={10} />
              <YAxis domain={['auto', 'auto']} stroke="#000" fontSize={11} fontWeight="black" tickFormatter={(v) => formatVal(v)} />
              <Tooltip 
                formatter={tooltipFormatter} 
                labelFormatter={formatQuarter} 
                contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'black' }} 
              />
              <Line name="Previsão Central" type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 5, fill: '#3b82f6' }} />
              <Area name="Intervalo de Confiança" dataKey="confidenceUpper" stroke="none" fill="#3b82f6" fillOpacity={0.05} />
              <Area dataKey="confidenceLower" stroke="none" fill="#fff" fillOpacity={1} />
              <Line name="Limite Superior" type="monotone" dataKey="confidenceUpper" stroke="#10b981" strokeWidth={1} dot={false} opacity={0.3} />
              <Line name="Limite Inferior" type="monotone" dataKey="confidenceLower" stroke="#ef4444" strokeWidth={1} dot={false} opacity={0.3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const RegionalGridChart = ({ title, type, formatVal }: any) => {
    const regionalSeries = useMemo(() => getRegionalSeries(type, rawRows.tomadores, rawRows.estoques, rawRows.concessoes, filters, 'REGIAO'), [type, rawRows, filters]);
    
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
        <h4 className="text-[11px] font-black uppercase text-slate-500 mb-6 flex items-center">
          <ChartAreaIcon size={14} className="mr-2 text-sky-600" /> {title}
        </h4>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={regionalSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tickFormatter={formatQuarter} fontSize={9} fontWeight="black" axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tickFormatter={formatVal} fontSize={9} fontWeight="black" axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={formatQuarter} formatter={(v: number, name: string) => [formatVal(v), name]} contentStyle={{ borderRadius: '10px', fontSize: '10px', border: 'none', fontWeight: 'black' }} />
              {REGIOES.map((r, i) => (
                <Line key={r} type="monotone" dataKey={r} stroke={[COLORS.primary, COLORS.secondary, COLORS.success, COLORS.danger, COLORS.warning][i]} strokeWidth={2} dot={false} animationDuration={800} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const UFTableSection = ({ title, type, formatVal }: any) => {
    const tableData = useMemo(() => getUFTableData(type, rawRows.tomadores, rawRows.estoques, rawRows.concessoes, filters, UF_MAP), [type, rawRows, filters]);
    const periodLabel = latest ? formatQuarter(latest.quarter) : '-';

    return (
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[500px]">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 shrink-0 flex items-center justify-between">
          <h3 className="font-black text-black text-sm uppercase tracking-tight">{title}</h3>
          <div className="flex items-center text-slate-400">
             <CalendarIcon size={12} className="mr-1" />
             <span className="text-[10px] font-black uppercase">Último dado: {periodLabel}</span>
          </div>
        </div>
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">UF</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Nome</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Valor</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Δ 3m</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Δ 6m</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Δ 12m</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableData.map((row) => {
                const renderVar = (val: number, isRate: boolean) => {
                  const suffix = isRate ? " p.p." : "%";
                  // Usuário pediu Azul para positivo, Vermelho para negativo
                  const colorClass = val > 0 ? 'text-blue-600' : val < 0 ? 'text-red-600' : 'text-slate-400';
                  return (
                    <span className={`flex items-center justify-end space-x-1 font-bold text-[11px] ${colorClass}`}>
                      {val > 0 ? <ArrowUpIcon size={10} /> : val < 0 ? <ArrowDownIcon size={10} /> : null}
                      <span>{Math.abs(val).toFixed(2)}{suffix}</span>
                    </span>
                  );
                };
                return (
                  <tr key={row.sigla} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 text-sm font-black">{row.sigla}</td>
                    <td className="px-4 py-2 text-[11px] font-bold text-slate-500">{row.nome}</td>
                    <td className="px-4 py-2 text-sm font-black text-right">{formatVal(row.current)}</td>
                    <td className="px-4 py-2 text-[11px] text-right">{renderVar(row.var3m, row.isRate)}</td>
                    <td className="px-4 py-2 text-[11px] text-right">{renderVar(row.var6m, row.isRate)}</td>
                    <td className="px-4 py-2 text-[11px] text-right">{renderVar(row.var12m, row.isRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!latest) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-black font-sans">
      <aside className="w-16 md:w-20 bg-slate-900 flex flex-col items-center py-8 space-y-10 z-50 shadow-2xl shrink-0">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform cursor-pointer">
          <TrendingUpIcon className="text-white" size={24} />
        </div>
        <nav className="flex flex-col space-y-6">
          <button onClick={() => setActiveTab('dashboard')} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}><LayoutDashboardIcon size={24} /></button>
          <button onClick={() => setActiveTab('chat')} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${activeTab === 'chat' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}><MessageSquareIcon size={24} /></button>
        </nav>
        <div className="flex-1" />
        <button onClick={() => setShowSettings(true)} className="p-4 text-slate-500 hover:text-white"><SettingsIcon size={24} /></button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-auto md:h-28 bg-white border-b border-slate-200 px-6 md:px-12 py-4 md:py-0 flex flex-col md:flex-row items-start md:items-center justify-between z-40 shrink-0 gap-4">
          <div className="flex items-center space-x-4 md:space-x-8 w-full md:w-auto">
            <button 
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden p-2 bg-slate-100 rounded-lg text-slate-600"
            >
              <MenuIcon size={20} />
            </button>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black italic tracking-tighter leading-none whitespace-nowrap">
                SABIÁ <span className="text-lg sm:text-xl md:text-[28px] font-black align-top ml-1 text-sky-600/60">V1.1</span>
              </h1>
              <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] text-sky-600 mt-1 md:mt-2 truncate">Assistente Sebrae de Dados de Crédito</p>
            </div>
            <div className="hidden sm:block h-10 w-[2px] bg-slate-900"></div>
            <div className="hidden sm:flex bg-slate-100 px-3 md:px-5 py-2 rounded-xl border border-slate-200 shadow-sm items-center space-x-3">
              <CalendarIcon size={18} />
              <span className="font-black text-[10px] md:text-sm uppercase whitespace-nowrap">{formatQuarter(processedData[0].quarter)} — {formatQuarter(latest.quarter)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto">
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 md:px-6 py-2 md:py-3 bg-sky-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl shadow-sky-600/20 hover:bg-sky-700 transition-all flex-1 md:flex-none justify-center">
               <UploadCloudIcon size={16} className="md:w-[18px] md:h-[18px]" />
               <span className="whitespace-nowrap">{dataSource === 'mock' ? 'Subir Base' : 'Trocar Base'}</span>
             </button>
             <div className="flex items-center space-x-2 md:space-x-3 bg-slate-50 p-1 md:p-2 md:pr-5 rounded-xl md:rounded-2xl border border-slate-100 flex-1 md:flex-none">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-sky-900 flex items-center justify-center text-white shrink-0"><UsersIcon size={16} className="md:w-5 md:h-5" /></div>
                <div className="flex flex-col overflow-hidden"><span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Giovanni Beviláqua</span><span className="text-[10px] md:text-xs font-black truncate">Sebrae Nacional</span></div>
             </div>
          </div>
        </header>

        {isMobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex justify-end">
            <div className="w-80 bg-white h-full shadow-2xl animate-slide-in-right overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-black text-black uppercase text-sm">Filtros Avançados</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-slate-400"><XIcon size={20} /></button>
              </div>
              <div className="p-6">
                <FilterPanel filters={filters} onChange={setFilters} availableModalidades={availableModalidades} />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'dashboard' && (
            <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto p-10 hidden lg:block shrink-0">
              <FilterPanel filters={filters} onChange={setFilters} availableModalidades={availableModalidades} />
            </aside>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-12 bg-[#f8fafc]/50">
            {activeTab === 'dashboard' ? (
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center space-x-6 mb-10">
                  <div className="h-1 flex-1 bg-slate-200"></div>
                  <h2 className="text-xl md:text-2xl font-black text-black tracking-tighter uppercase italic">1. Cenário Atual — {formatQuarter(latest.quarter)}</h2>
                  <div className="h-1 flex-1 bg-slate-200"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
                  <StatCard title="TOMADORES ÚNICOS" value={formatNumberBR(latest.tomadores, 0)} trendQoQ={getTrend(latest.tomadores, previous?.tomadores)} trendYoY={getTrend(latest.tomadores, yearAgo?.tomadores)} icon={<UsersIcon size={24} />} color={COLORS.success} />
                  <StatCard title="QTD. OPERAÇÕES" value={formatNumberBR(latest.operacoes, 0)} trendQoQ={getTrend(latest.operacoes, previous?.operacoes)} trendYoY={getTrend(latest.operacoes, yearAgo?.operacoes)} icon={<BriefcaseIcon size={24} />} color={COLORS.neutral} />
                  <StatCard title="CONCESSÃO" value={formatCurrency(latest.concessao)} trendQoQ={getTrend(latest.concessao, previous?.concessao)} trendYoY={getTrend(latest.concessao, yearAgo?.concessao)} icon={<CreditCardIcon size={24} />} color={COLORS.primary} />
                  <StatCard title="JUROS MÉDIO" value={formatPercent(latest.taxaJuros, '% a.a.')} trendQoQ={getTrend(latest.taxaJuros, previous?.taxaJuros)} trendYoY={getTrend(latest.taxaJuros, yearAgo?.taxaJuros)} icon={<TrendingUpIcon size={24} />} color={COLORS.warning} />
                  <StatCard title="INADIMPLÊNCIA" value={formatPercent(latest.inadRate)} trendQoQ={getTrend(latest.inadRate, previous?.inadRate)} trendYoY={getTrend(latest.inadRate, yearAgo?.inadRate)} icon={<PercentIcon size={24} />} color={COLORS.danger} />
                  <StatCard title="SALDO CARTEIRA" value={formatCurrency(latest.saldo)} trendQoQ={getTrend(latest.saldo, previous?.saldo)} trendYoY={getTrend(latest.saldo, yearAgo?.saldo)} icon={<WalletIcon size={24} />} color={COLORS.secondary} />
                </div>

                <div className="flex items-center space-x-6 mb-10">
                  <div className="h-1 flex-1 bg-slate-200"></div>
                  <h2 className="text-xl md:text-2xl font-black text-black tracking-tighter uppercase italic">2. Indicadores e Distribuição</h2>
                  <div className="h-1 flex-1 bg-slate-200"></div>
                </div>
                <KPISec title="Quantidade de Tomadores" dataKey="tomadores" icon={<UsersIcon size={24} />} color={COLORS.success} formatVal={(v: number) => formatNumberBR(v, 0)} isInteger={true} />
                <KPISec title="Quantidade de Operações" dataKey="operacoes" icon={<BriefcaseIcon size={24} />} color={COLORS.neutral} formatVal={(v: number) => formatNumberBR(v, 0)} isInteger={true} />
                <KPISec title="Concessão de Crédito" dataKey="concessao" icon={<CreditCardIcon size={24} />} color={COLORS.primary} formatVal={formatCurrency} />
                <KPISec title="Saldo da Carteira" dataKey="saldo" icon={<WalletIcon size={24} />} color={COLORS.secondary} formatVal={formatCurrency} />
                <KPISec title="Taxa de Juros" dataKey="taxaJuros" icon={<TrendingUpIcon size={24} />} color={COLORS.warning} formatVal={(v: number) => formatPercent(v, '% a.a.')} />
                <KPISec title="Taxa de Inadimplência" dataKey="inadRate" icon={<PercentIcon size={24} />} color={COLORS.danger} formatVal={formatPercent} />

                <div className="flex items-center space-x-6 mb-4 mt-20">
                  <div className="h-1 flex-1 bg-sky-200"></div>
                  <h2 className="text-xl md:text-2xl font-black text-sky-900 tracking-tighter uppercase italic">3. Cenários e Previsões</h2>
                  <div className="h-1 flex-1 bg-sky-200"></div>
                </div>
                
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl mb-10 flex items-start space-x-3 shadow-sm">
                  <AlertCircleIcon className="text-sky-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-[10px] md:text-xs font-bold text-sky-900 leading-relaxed uppercase tracking-tight">
                    Aviso: As projeções apresentadas são baseadas em modelos estatísticos aplicados aos dados históricos disponíveis. Elas representam tendências matemáticas analíticas e não devem ser interpretadas como previsões determinísticas ou garantia de resultados futuros.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  <ForecastSection title="Concessão de Crédito" dataKey="concessao" formatVal={formatCurrency} />
                  <ForecastSection title="Saldo da Carteira" dataKey="saldo" formatVal={formatCurrency} />
                  <ForecastSection title="Taxa de Juros" dataKey="taxaJuros" formatVal={(v: number) => formatPercent(v, '% a.a.')} />
                  <ForecastSection title="Inadimplência" dataKey="inadRate" formatVal={formatPercent} />
                </div>

                <div className="flex items-center space-x-6 mb-10 mt-20">
                  <div className="h-1 flex-1 bg-slate-200"></div>
                  <h2 className="text-xl md:text-2xl font-black text-black tracking-tighter uppercase italic">4. Análise Comparativa Regional</h2>
                  <div className="h-1 flex-1 bg-slate-200"></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                  <RegionalGridChart title="Tomadores de Crédito" type="tomadores" formatVal={(v: number) => formatNumberBR(v, 0)} />
                  <RegionalGridChart title="Quantidade de Operações" type="operacoes" formatVal={(v: number) => formatNumberBR(v, 0)} />
                  <RegionalGridChart title="Concessão de Crédito" type="concessao" formatVal={formatCurrency} />
                  <RegionalGridChart title="Saldo da Carteira de Crédito" type="saldo" formatVal={formatCurrency} />
                  <RegionalGridChart title="Taxa Média de Juros" type="taxaJuros" formatVal={(v: number) => formatPercent(v, '% a.a.')} />
                  <RegionalGridChart title="Taxa de Inadimplência" type="inadRate" formatVal={formatPercent} />
                </div>

                <div className="flex items-center space-x-6 mb-10 mt-20">
                  <div className="h-1 flex-1 bg-slate-200"></div>
                  <h2 className="text-xl md:text-2xl font-black text-black tracking-tighter uppercase italic">5. Análise por Unidade da Federação</h2>
                  <div className="h-1 flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-20">
                  <UFTableSection title="Tomadores de Crédito" type="tomadores" formatVal={(v: number) => formatNumberBR(v, 0)} />
                  <UFTableSection title="Quantidade de Operações" type="operacoes" formatVal={(v: number) => formatNumberBR(v, 0)} />
                  <UFTableSection title="Concessão de Crédito" type="concessao" formatVal={formatCurrency} />
                  <UFTableSection title="Saldo da Carteira" type="saldo" formatVal={formatCurrency} />
                  <UFTableSection title="Taxa de Juros Média" type="taxaJuros" formatVal={(v: number) => formatPercent(v, '% a.a.')} />
                  <UFTableSection title="Taxa de Inadimplência" type="inadRate" formatVal={formatPercent} />
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-20">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12"><FileTextIcon size={200} /></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 border-b border-white/10 pb-8 mb-8">
                      <div className="bg-sky-500 p-3 rounded-2xl"><FileTextIcon size={24} /></div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Ficha Técnica — SABIÁ V1.1</h2>
                        <p className="text-sky-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">Sebrae Nacional • 2026</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                      <div className="space-y-6">
                        <div className="mb-4">
                           <p className="text-[13px] font-black uppercase tracking-[0.2em] text-sky-400 mb-1">SEBRAE NACIONAL</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Unidade de Capitalização e Serviços Financeiros</p>
                          <div className="space-y-2">
                            <p className="font-black text-slate-200 uppercase tracking-tight text-sm md:text-base">Valdir Oliveira <span className="text-[10px] text-sky-400 opacity-60 ml-2">(Gerente)</span></p>
                            <p className="font-black text-slate-200 uppercase tracking-tight text-sm md:text-base">Weniston Abreu <span className="text-[10px] text-sky-400 opacity-60 ml-2">(Gerente-Adjunto)</span></p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Núcleo de Acesso a Crédito e Investimentos</p>
                          <div className="space-y-1">
                             <p className="text-[10px] text-sky-400 uppercase font-black">Coordenação</p>
                             <p className="font-black text-white uppercase italic text-sm md:text-base">Giovanni Beviláqua</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Equipe Técnica</p>
                          <div className="space-y-3">
                             <p className="font-black text-white uppercase tracking-tighter text-base md:text-lg leading-none">Carlos Pereira</p>
                             <p className="font-black text-white uppercase tracking-tighter text-base md:text-lg leading-none">Igor Villar</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto h-full py-4 md:py-8"><ChatBot data={processedData} filters={filters} dataSource={dataSource} /></div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
