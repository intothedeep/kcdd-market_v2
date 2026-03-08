/**
 * Donor Support Page
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sidebar, SidebarGroup, SidebarItem, SidebarFooter } from '@/components/ui/sidebar'
import { 
  Settings,
  LayoutDashboard,
  Heart,
  BarChart3,
  FileText,
  HelpCircle,
  PanelLeft,
  MessageSquare,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Loader2,
  Send
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { fetchSupportFAQs, fetchSupportContactInfo, type SupportFAQ, type SupportContactInfo } from '@/lib/supabase'

export function DonorSupport() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({ subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [faqs, setFaqs] = useState<SupportFAQ[]>([])
  const [contactInfo, setContactInfo] = useState<SupportContactInfo[]>([])
  const [loading, setLoading] = useState(true)

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [faqsData, contactData] = await Promise.all([
          fetchSupportFAQs('donor'),
          fetchSupportContactInfo()
        ])
        setFaqs(faqsData)
        setContactInfo(contactData)
      } catch (error) {
        console.error('Error loading support data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSending(false)
    setContactForm({ subject: '', message: '' })
    alert('Message sent! We\'ll get back to you within 24 hours.')
  }

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare className="h-6 w-6 text-gray-700" />
      case 'email': return <Mail className="h-6 w-6 text-gray-700" />
      case 'phone': return <Phone className="h-6 w-6 text-gray-700" />
      default: return <HelpCircle className="h-6 w-6 text-gray-700" />
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 border-r border-gray-200 bg-white overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && <span className="font-semibold text-gray-900">KC Digital Drive</span>}
          </div>
        </div>
        
        <SidebarGroup label={sidebarOpen ? "Menu" : undefined}>
          <SidebarItem 
            icon={<LayoutDashboard className="h-4 w-4 text-gray-700" />} 
            active={isActive('/donor/dashboard')}
            onClick={() => navigate('/donor/dashboard')}
          >
            {sidebarOpen && "Dashboard"}
          </SidebarItem>
          <SidebarItem 
            icon={<Heart className="h-4 w-4 text-gray-700" />}
            active={isActive('/requests')}
            onClick={() => navigate('/requests')}
          >
            {sidebarOpen && "Browse Requests"}
          </SidebarItem>
          <SidebarItem 
            icon={<BarChart3 className="h-4 w-4 text-gray-700" />}
            active={isActive('/donor/impact')}
            onClick={() => navigate('/donor/impact')}
          >
            {sidebarOpen && "Impact Report"}
          </SidebarItem>
          <SidebarItem 
            icon={<FileText className="h-4 w-4 text-gray-700" />}
            active={isActive('/donor/documents')}
            onClick={() => navigate('/donor/documents')}
          >
            {sidebarOpen && "Tax Documents"}
          </SidebarItem>
        </SidebarGroup>

        <SidebarGroup label={sidebarOpen ? "Account" : undefined}>
          <SidebarItem 
            icon={<Settings className="h-4 w-4 text-gray-700" />}
            onClick={() => navigate('/donor/dashboard')}
          >
            {sidebarOpen && "Settings"}
          </SidebarItem>
          <SidebarItem 
            icon={<HelpCircle className="h-4 w-4 text-gray-700" />}
            active={isActive('/donor/support')}
            onClick={() => navigate('/donor/support')}
          >
            {sidebarOpen && "Support"}
          </SidebarItem>
        </SidebarGroup>

        <SidebarFooter>
          <div className={`flex items-center gap-3 p-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
              {user?.firstName?.[0] || 'D'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.emailAddresses?.[0]?.emailAddress || ''}</p>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8 p-0">
                <PanelLeft className="h-4 w-4" />
              </Button>
              <div>
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                  <Link to="/" className="hover:text-gray-700">Home</Link>
                  <span>/</span>
                  <Link to="/donor/dashboard" className="hover:text-gray-700">Dashboard</Link>
                  <span>/</span>
                  <span className="text-gray-900">Support</span>
                </nav>
                <h1 className="text-xl font-semibold text-gray-900 mt-1">Help & Support</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {contactInfo.map((contact) => (
              <Card key={contact.id} className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  {getContactIcon(contact.type)}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{contact.label}</h3>
                <p className="text-sm text-gray-500 mb-3">{contact.description}</p>
                {contact.type === 'chat' ? (
                  <span className="text-sm text-emerald-600 flex items-center">
                    {contact.value === 'available' ? 'Available now' : contact.value} <ExternalLink className="h-3 w-3 ml-1" />
                  </span>
                ) : (
                  <span className="text-sm text-gray-600">{contact.value}</span>
                )}
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FAQ Section */}
            <Card className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
              </div>
              {faqs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {faqs.map((item, i) => (
                    <div key={item.id} className="p-4">
                      <button 
                        className="w-full flex items-center justify-between text-left"
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      >
                        <span className="font-medium text-gray-900">{item.question}</span>
                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`} />
                      </button>
                      {expandedFaq === i && (
                        <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No FAQs available yet.</p>
                </div>
              )}
            </Card>

            {/* Contact Form */}
            <Card className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Send us a Message</h2>
                <p className="text-sm text-gray-500">We&apos;ll respond within 24 hours</p>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="What do you need help with?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe your issue or question..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800" disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
