import React from 'react';
import { data, useNavigate } from 'react-router';
import { ArrowRight, Bot, Cpu, Zap, Shield , CircleUser } from 'lucide-react';
import { logo } from '../constents';
import { getUserData } from '../userStore/userData';
import { AppRoute } from '../types';

const Landing = () => {
  const navigate = useNavigate();
  const user = getUserData("user")

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-secondary">

      {/* Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-20 h-20 rounded-lg flex items-center justify-center">
            <img src={logo} alt="" />

            <Cpu className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-primary"></span>
        </div>
        {user ?<CircleUser className=' h-7 w-7'/>: <div className="flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-subtext hover:text-primary font-medium transition-colors"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="bg-primary text-white px-5 py-2 rounded-full font-semibold hover:opacity-90 transition-colors shadow-lg shadow-primary/20"
          >
            Get Started
          </button>
        </div>}

      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-sm text-subtext mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Powered by UWO
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-maintext">
          The Future of <br />
          <span className="text-primary">Conversational AI</span>
        </h1>

        <p className="text-lg text-subtext max-w-2xl mb-10 leading-relaxed">
          Experience the next generation of intelligent assistance.
          AI Mall learns, adapts, and creates with you in real-time through a stunning interface.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">

          <button
            onClick={() => user ? navigate(AppRoute.DASHBOARD) : navigate(AppRoute.SIGNUP)}
            className="px-8 py-4 bg-primary rounded-2xl font-bold text-lg text-white shadow-xl shadow-primary/30 hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Start Now <ArrowRight className="w-5 h-5" />
          </button>
          {!user && <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-white border border-border rounded-2xl font-bold text-lg text-maintext hover:bg-surface transition-all duration-300 shadow-sm"
          >
            Existing User
          </button>}



        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">

          <div className="p-6 rounded-2xl bg-white border border-border shadow-md hover:shadow-xl hover:border-primary/20 transition-all">
            <Bot className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2 text-maintext">Smart Agents</h3>
            <p className="text-subtext">
              Access a marketplace of specialized AI agents for coding, writing, and analysis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-border shadow-md hover:shadow-xl hover:border-primary/20 transition-all">
            <Zap className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2 text-maintext">Real-time Speed</h3>
            <p className="text-subtext">
              Powered by the fastest Gemini models for instant, fluid conversation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-border shadow-md hover:shadow-xl hover:border-primary/20 transition-all">
            <Shield className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2 text-maintext">Secure & Private</h3>
            <p className="text-subtext">
              Enterprise-grade security ensures your data and conversations stay private.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
};

export default Landing;