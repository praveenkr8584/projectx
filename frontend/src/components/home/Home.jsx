import React from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import CTASection from './CTASection';
import Footer from '../common/Footer';
import './Home.css';

const Home = ({ isLoggedIn }) => {
  return (
    <div className="home">
      <HeroSection isLoggedIn={isLoggedIn} />
      <FeaturesSection />
      <CTASection isLoggedIn={isLoggedIn} />
      <Footer />
    </div>
  );
};

export default Home;
