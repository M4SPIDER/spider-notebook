import React, { useEffect } from 'react';
import { ChevronLeft, Shield, FileText, Scale } from 'lucide-react';
import { LEGAL_SECTIONS } from './legalContent';

const SectionCard = ({ icon, title, children }) => (
  <section className="rounded-3xl border border-[#194040] bg-[#0B2A2A] p-5 md:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#102B2B] text-[#00E5FF]">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-white md:text-xl">{title}</h2>
    </div>
    {children}
  </section>
);

export default function LegalPage() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const prev = {
      htmlBg: html.style.background,
      bodyBg: body.style.background,
      bodyMargin: body.style.margin,
      bodyMinHeight: body.style.minHeight,
      rootBg: root?.style.background || '',
      theme: themeMeta?.getAttribute('content') || '',
    };

    html.style.background = '#091E1E';
    body.style.background = '#091E1E';
    body.style.margin = '0';
    body.style.minHeight = '100vh';
    if (root) root.style.background = '#091E1E';
    if (themeMeta) themeMeta.setAttribute('content', '#091E1E');

    return () => {
      html.style.background = prev.htmlBg;
      body.style.background = prev.bodyBg;
      body.style.margin = prev.bodyMargin;
      body.style.minHeight = prev.bodyMinHeight;
      if (root) root.style.background = prev.rootBg;
      if (themeMeta) themeMeta.setAttribute('content', prev.theme || '#ffffff');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#091E1E] text-white overscroll-none">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-12">
        <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#194040] bg-[#102B2B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7CE7FF]">
              M4 Spider
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-4xl">Terms, Privacy & Licenses</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#7AB7B3]">
              This page explains the current privacy notice, product terms, and third-party model or framework licensing summary for Spider AI.
            </p>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#194040] bg-[#102B2B] px-4 py-3 text-sm font-semibold text-[#00E5FF] transition-colors hover:bg-[#153737]"
          >
            <ChevronLeft size={16} />
            Back to Spider AI
          </a>
        </div>

        <div className="grid gap-5 md:gap-6">
          <SectionCard icon={<Shield size={18} />} title="Privacy Notice">
            <ul className="space-y-3 text-sm leading-7 text-[#7AB7B3]">
              {LEGAL_SECTIONS.privacy.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard icon={<Scale size={18} />} title="Terms & Conditions">
            <ul className="space-y-3 text-sm leading-7 text-[#7AB7B3]">
              {LEGAL_SECTIONS.terms.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard icon={<FileText size={18} />} title="Licenses & Service Terms">
            <div className="space-y-4">
              {LEGAL_SECTIONS.licenses.map((item) => (
                <div key={item.name} className="rounded-2xl border border-[#163737] bg-[#0D2020] p-4">
                  <div className="mb-1 text-sm font-semibold text-white">{item.name}</div>
                  <p className="text-sm leading-7 text-[#7AB7B3]">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
