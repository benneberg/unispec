import React from 'react';
import { type Workspace } from '../types';
import { Box, Check, ChevronRight, FileCog, FileText, GitMerge, Loader2, Palette, ShieldCheck, Zap, AlertTriangle, Download } from './Icons';

type PipelineStatus = 'pending' | 'in-progress' | 'complete' | 'error';

interface PipelineNodeProps {
  title: string;
  status: PipelineStatus;
  icon: React.ReactNode;
  description: string;
}

const PipelineNode: React.FC<PipelineNodeProps> = ({ title, status, icon, description }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return {
          ring: 'border-emerald-200 bg-emerald-50',
          dot: 'bg-emerald-500',
          text: 'text-emerald-700',
          desc: 'text-emerald-600/70',
        };
      case 'in-progress':
        return {
          ring: 'border-blue-200 bg-blue-50 animate-pulse',
          dot: 'bg-blue-500',
          text: 'text-blue-700',
          desc: 'text-blue-600/70',
        };
      case 'error':
         return {
          ring: 'border-rose-200 bg-rose-50',
          dot: 'bg-rose-500',
          text: 'text-rose-700',
          desc: 'text-rose-600/70',
        };
      case 'pending':
      default:
        return {
          ring: 'border-slate-200 bg-slate-50 opacity-60',
          dot: 'bg-slate-300',
          text: 'text-slate-700',
          desc: 'text-slate-400',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`flex-1 min-w-[140px] p-5 rounded-2xl border ${styles.ring} transition-all duration-500 hover:scale-[1.02]`}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
             <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
             {status === 'complete' && <Check className="w-3 h-3 text-emerald-500" />}
             {status === 'in-progress' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
             {status === 'error' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
        </div>
        <div>
            <h4 className={`text-sm font-black uppercase tracking-wider ${styles.text}`}>{title}</h4>
            <p className={`text-[10px] font-bold mt-1 ${styles.desc}`}>{description}</p>
        </div>
      </div>
    </div>
  );
};


interface PipelineViewProps {
  workspace: Workspace;
  agentStatus: 'idle' | 'analyzing' | 'comparing_normalizing' | 'consolidating' | 'generating_visuals' | 'validating' | 'complete' | 'error';
  error: boolean;
}

const PipelineView: React.FC<PipelineViewProps> = ({ workspace, agentStatus, error }) => {
    const { variants, consolidatedSpecs } = workspace;
    const isAnalysisDone = variants.length > 0 && variants.every(v => v.extractionProgress === v.totalExtractionSteps);

    const getStatus = (
        stage: 'input' | 'analyze' | 'compare' | 'consolidate' | 'visualize' | 'validate' | 'output'
    ): PipelineStatus => {
        if (error && (
            (stage === 'analyze' && agentStatus === 'analyzing') ||
            (stage === 'compare' && agentStatus === 'comparing_normalizing') ||
            (stage === 'consolidate' && agentStatus === 'consolidating') ||
            (stage === 'visualize' && agentStatus === 'generating_visuals') ||
            (stage === 'validate' && agentStatus === 'validating') ||
            agentStatus === 'error'
        )) {
            return 'error';
        }

        switch (stage) {
            case 'input':
                return variants.length > 0 ? 'complete' : 'pending';
            case 'analyze':
                if (isAnalysisDone) return 'complete';
                if (agentStatus === 'analyzing') return 'in-progress';
                return 'pending';
            case 'compare':
                if (workspace.consolidatedSpecs?.migration) return 'complete'; 
                if (consolidatedSpecs) return 'complete';
                if (agentStatus === 'comparing_normalizing') return 'in-progress';
                return 'pending';
            case 'consolidate':
                if (consolidatedSpecs?.architectureDiagrams) return 'complete';
                if (consolidatedSpecs) return 'complete';
                if (agentStatus === 'consolidating') return 'in-progress';
                return 'pending';
            case 'visualize':
                if (consolidatedSpecs?.validationReport) return 'complete';
                if (consolidatedSpecs?.architectureDiagrams) return 'complete';
                if (agentStatus === 'generating_visuals') return 'in-progress';
                return 'pending';
            case 'validate':
                if (agentStatus === 'complete') return 'complete';
                if (consolidatedSpecs?.validationReport) return 'complete';
                if (agentStatus === 'validating') return 'in-progress';
                return 'pending';
            case 'output':
                 if (agentStatus === 'complete') return 'complete';
                 return 'pending';
            default:
                return 'pending';
        }
    }

    return (
        <div className="soft-out rounded-3xl p-8 bg-white/40">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Analysis Pipeline</h3>
                <div className="px-3 py-1 bg-white soft-button rounded-full text-[10px] font-bold text-slate-500">
                    Auto-Orchestration Active
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
               <PipelineNode title="Input" description={`${variants.length} Sources`} status={getStatus('input')} icon={<FileText className="w-4 h-4" />} />
               <PipelineNode title="Decon" description="Extract Traits" status={getStatus('analyze')} icon={<Zap className="w-4 h-4" />} />
               <PipelineNode title="Align" description="Synthesize" status={getStatus('compare')} icon={<GitMerge className="w-4 h-4" />} />
               <PipelineNode title="Merge" description="Unify Context" status={getStatus('consolidate')} icon={<FileCog className="w-4 h-4" />} />
               <PipelineNode title="Graph" description="Architecture" status={getStatus('visualize')} icon={<Palette className="w-4 h-4" />} />
               <PipelineNode title="Audit" description="Logic Check" status={getStatus('validate')} icon={<ShieldCheck className="w-4 h-4" />} />
               <PipelineNode title="Ship" description="Ready Bundle" status={getStatus('output')} icon={<Download className="w-4 h-4" />} />
            </div>
        </div>
    );
};

export default PipelineView;
