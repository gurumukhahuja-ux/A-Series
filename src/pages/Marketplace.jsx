import React, { useEffect, useState } from 'react';
import { Search, Download, Check, Star, FileText, Play, X } from 'lucide-react';
import axios from 'axios';
import { apis } from '../types';
import { getUserData, toggleState } from '../userStore/userData';
import SubscriptionForm from '../Components/SubscriptionForm/SubscriptionForm';
import { useRecoilState } from 'recoil';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import NotificationBar from '../Components/NotificationBar/NotificationBar';



const Marketplace = () => {
  const [agents, setAgents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userAgent, setUserAgent] = useState([])
  const [loading, setLoading] = useState(false)
  const [subToggle, setSubToggle] = useRecoilState(toggleState)
  const user = getUserData("user")
  const [agentId, setAgentId] = useState("")
  const [searchQuery, setSearchQuery] = useState("");
  const [showDemo, setShowDemo] = useState(false)
  const [demoUrl, setDemoUrl] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    // setLoading(true)
    console.log(subToggle);


    // localStorage.setItem("agents", JSON.stringify(agents))
    axios.post(apis.getUserAgents, { userId: user?.id }).then((res) => {
      setUserAgent(res.data.agents)
      console.log(res.data.agents);
      setLoading(false)

    }).catch(err => console.log(err))
    axios.get(apis.agents).then((agent) => {
      setAgents(agent.data)
      console.log(agent.data);
    }).catch((err) => {
      console.log(err);
    })

  }, [agentId])


  const toggleBuy = (id) => {
    setSubToggle({ ...subToggle, subscripPgTgl: true })
    setAgentId(id)
  };

  const filteredAgents = agents.filter(agent => {
    const matchesCategory = filter === 'all' || agent.category === filter;
    const matchesSearch = agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', "Business OS",
    "Data & Intelligence",
    "Sales & Marketing",
    "HR & Finance",
    "Design & Creative",
    "Medical & Health AI",];

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-secondary">

      <AnimatePresence>
        {subToggle.subscripPgTgl && <SubscriptionForm id={agentId} />}
        {showDemo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl relative"
            >
              <button
                onClick={() => setShowDemo(false)}
                className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-lg hover:bg-surface transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={demoUrl}
                  title="Agent Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-maintext">Agent Product Demo</h3>
                <button
                  onClick={() => setShowDemo(false)}
                  className="bg-primary text-white px-6 py-2 rounded-xl font-semibold"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-maintext mb-2">
            Agent Marketplace
          </h1>
          <p className="text-sm md:text-base text-subtext">
            Discover and install powerful AI agents for your workflow.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 w-4 h-4 text-subtext" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-maintext focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-all border ${filter === cat
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-subtext border-border hover:bg-surface'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <h1>Loading.....</h1> : filteredAgents.map(agent => (
          <div
            key={agent._id}
            className="group bg-white border border-border hover:border-primary/50 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 flex flex-col h-full shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">

              <img
                src={agent.avatar}
                alt={agent.agentName}
                className="w-19 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="bg-surface border border-border px-2 py-1 rounded-lg flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-maintext">4.9</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-maintext text-2xl font-bold">{agent.agentName} <sup className='text-sm'>TM</sup></h3>
              <button
                onClick={() => {
                  setDemoUrl(agent.demoVideoUrl || "https://www.youtube.com/embed/dQw4w9wgXcQ");
                  setShowDemo(true);
                }}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
              >
                <Play className="w-3 h-3 fill-primary" /> Demo
              </button>
            </div>

            <span className="text-xs text-primary uppercase tracking-wider font-semibold mb-3">
              {agent.category}
            </span>

            <p className="text-sm text-subtext mb-6 flex-1">{agent.description}</p>

            {/* Install Button */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleBuy(agent._id)}
                disabled={userAgent.some((ag) => agent._id == ag._id)}
                className={`flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${userAgent.some((ag) => agent._id == ag._id)
                  ? 'bg-blue-50 text-subtext border border-blue-100 cursor-not-allowed opacity-70'
                  : 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20'
                  }`}
              >
                {userAgent.some((ag) => agent._id == ag._id) ? (
                  <>
                    <Check className="w-4 h-4" /> Subscribed
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Subscribe
                  </>
                )}
              </button>
              {userAgent.some((ag) => agent._id == ag._id) && (
                <button
                  onClick={() => {
                    navigate(AppRoute.INVOICES);
                  }}
                  className="p-2.5 rounded-xl bg-surface border border-border text-subtext hover:text-primary transition-all"
                  title="Download Invoice"
                >
                  <FileText className="w-5 h-5" />
                </button>
              )}
            </div>
          </div >
        ))}

      </div >
    </div >
  );
};

export default Marketplace;