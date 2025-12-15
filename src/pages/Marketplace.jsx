import React, { useEffect, useState } from 'react';
import { Search, Download, Check, Star } from 'lucide-react';
import axios from 'axios';
import { apis } from '../types';
import { getUserData, toggleState } from '../userStore/userData';
import SubscriptionForm from '../Components/SubscriptionForm/SubscriptionForm';
import { useRecoilState } from 'recoil';
import { AnimatePresence } from 'motion/react';
import NotificationBar from '../Components/NotificationBar/NotificationBar';

const MOCK_AGENTS = [
  {
    id: '1',
    name: 'AIBIZ – AI Business Assistant',
    description: 'AIBIZ helps you instantly create business plans, pitch decks, strategies, and market analysis based on your product or startup idea.Just enter your business info and get professional‑ready documents in minutes.',
    avatar: '/AIBIZ.jpeg',
    category: 'Business',
    installed: true,
    instructions: '',
    URL: "http://localhost:5174/"
  },
  {
    id: '2',
    name: 'Content Writer',
    description: 'AI Content Writer helps you instantly generate professional marketing content for social media, blogs, ads, and scripts—based on a simple topic.Just enter a topic and platform, and get ready‑to‑publish content in seconds.',
    avatar: 'https://picsum.photos/200/200?random=2',
    category: 'Content',
    installed: false,
    instructions: '',
    URL: "http://localhost:5174/"

  },
  {
    id: '3',
    name: 'AISA – AI Smart Assistant',
    description: 'AISA is your intelligent AI assistant that helps you generate answers, ideas, summaries, and explanations instantly—just by asking a question. It understands context, follows instructions, and responds like a real professional helper.',
    avatar: 'https://picsum.photos/200/200?random=3',
    category: 'productivity',
    installed: false,
    instructions: '',
    URL: "http://localhost:5174/"

  }
];

const Marketplace = () => {
  const [agents, setAgents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userAgent, setUserAgent] = useState([])
  const [loading, setLoading] = useState(false)
  const [subToggle, setSubToggle] = useRecoilState(toggleState)
  const user = getUserData("user")
  const [agentId, setAgentId] = useState("")
  useEffect(() => {
    // setLoading(true)
    console.log(subToggle);


    // localStorage.setItem("agents", JSON.stringify(agents))
    axios.post(apis.getUserAgents, { userId: user.id }).then((res) => {
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
    // axios.post(`${apis.buyAgent}/${id}`, { userId: user.id }).then((res) => {
    //   console.log(res);
    // }).catch((err) => {
    //   console.log(err);
    // })
    // setAgents(prev =>
    //   prev.map(agent =>
    //     agent.id === id ? { ...agent, installed: !agent.installed } : agent
    //   )
    // );
  };

  const filteredAgents =
    filter === 'all' ? agents : agents.filter(a => a.category === filter);

  const categories = ['all', "Business OS",
    "Data & Intelligence",
    "Sales & Marketing",
    "HR & Finance",
    "Design & Creative",
    "Medical & Health AI",];

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-secondary">
      <AnimatePresence>
        {subToggle.subscripPgTgl &&
          <SubscriptionForm id={agentId} />
        }

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

            <h3 className="text-lg font-bold text-maintext mb-1 text-2xl font-bold">{agent.agentName} <sup className='text-sm'>TM</sup>  </h3>

            <span className="text-xs text-primary uppercase tracking-wider font-semibold mb-3">
              {agent.category}
            </span>

            <p className="text-sm text-subtext mb-6 flex-1">{agent.description}</p>

            {/* Install Button */}
            <button
              onClick={() => toggleBuy(agent._id)}
              className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${userAgent.some((ag) => agent._id == ag._id)
                ? 'bg-blue-50 text-primary border border-blue-100'
                : 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20'
                }`}
            >
              {userAgent.some((ag) => agent._id == ag._id) ? (
                <>
                  <Check className="w-4 h-4" /> Owned
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Buy
                </>
              )}
            </button>
          </div>
        ))}

      </div>
    </div>
  );
};

export default Marketplace;