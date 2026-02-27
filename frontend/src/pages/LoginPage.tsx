import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = isSignup
        ? await signup(email, password, company || undefined)
        : await login(email, password);
      setToken(res.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-[1]">
      <div className="w-full max-w-md p-8 glass-card rounded-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)' }}>
            P
          </div>
          <span className="font-bold text-xl tracking-tight">Prism</span>
        </div>

        <h1 className="text-2xl font-bold mb-1">AI Cost Analytics</h1>
        <p className="text-[rgba(255,255,255,0.55)] mb-6 text-sm">FinOps for AI — track your Claude API spend</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            required
          />
          {isSignup && (
            <input
              type="text"
              placeholder="Company name (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          )}
          {error && <p className="text-[#F43F5E] text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-black transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <p className="mt-4 text-center text-[rgba(255,255,255,0.55)] text-sm">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignup(!isSignup)} className="text-[#F59E0B] hover:text-[#FBBF24] font-medium">
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
