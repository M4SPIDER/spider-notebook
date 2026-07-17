import { useState, useEffect, useCallback } from 'react';
import BackgroundEffects from './components/BackgroundEffects';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import WhatWeDo from './components/WhatWeDo';
import Products from './components/Products';
import Projects from './components/Projects';
import Services from './components/Services';
import Vision from './components/Vision';
import WhyChooseUs from './components/WhyChooseUs';
import People from './components/People';
import Contact from './components/Contact';
import Footer from './components/Footer';

const sections = ['home', 'about', 'products', 'services', 'projects', 'people', 'contact'];

const CorporateSite = () => {
  const [active, setActive] = useState('home');

  const onNav = useCallback((id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const pos = window.scrollY + window.innerHeight / 3;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= pos) { setActive(sections[i]); break; }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen" style={{ background: '#0A1520' }}>
      <BackgroundEffects />
      <div className="relative z-10">
        <Navbar active={active} onNav={onNav} />
        <Hero onNav={onNav} />
        <About />
        <WhatWeDo />
        <Products />
        <Projects />
        <Services />
        <Vision />
        <WhyChooseUs />
        <People />
        <Contact />
        <Footer onNav={onNav} />
      </div>
    </div>
  );
};

export default CorporateSite;
