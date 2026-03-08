/**
 * Lucide Icon Picker Component
 * Allows users to select from a curated list of Lucide icons
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  // Organizations & Buildings
  Building,
  Building2,
  Landmark,
  Home,
  Store,
  Warehouse,
  Hotel,
  Church,
  School,
  Cross,
  Factory,
  // People & Community
  Users,
  UserCircle,
  Heart,
  HeartHandshake,
  HandHeart,
  Handshake,
  Baby,
  PersonStanding,
  Accessibility,
  // Education & Learning
  GraduationCap,
  BookOpen,
  Library,
  Pen,
  Pencil,
  // Health & Medical
  Stethoscope,
  Pill,
  Syringe,
  Activity,
  HeartPulse,
  // Nature & Environment
  Leaf,
  Trees,
  Flower2,
  Sun,
  CloudSun,
  Droplets,
  Recycle,
  // Food & Agriculture
  Apple,
  UtensilsCrossed,
  Wheat,
  Carrot,
  // Technology
  Laptop,
  Monitor,
  Smartphone,
  Wifi,
  Globe,
  Code,
  // Arts & Culture
  Music,
  Palette,
  Camera,
  Film,
  Mic,
  Theater,
  // Sports & Recreation
  Trophy,
  Medal,
  Dumbbell,
  Bike,
  // Animals
  Dog,
  Cat,
  Bird,
  Fish,
  PawPrint,
  // Finance & Business
  Briefcase,
  DollarSign,
  PiggyBank,
  TrendingUp,
  BarChart3,
  // Transportation
  Car,
  Bus,
  Plane,
  Ship,
  // Communication
  Mail,
  Phone,
  MessageCircle,
  Megaphone,
  // Misc
  Star,
  Sparkles,
  Award,
  Gift,
  Shield,
  Lightbulb,
  Target,
  Flag,
  Rocket,
  Compass,
  type LucideIcon,
} from 'lucide-react'

// Icon registry with categories
export const ICON_REGISTRY: Record<string, { icon: LucideIcon; label: string; category: string }> =
  {
    // Organizations & Buildings
    building: { icon: Building, label: 'Building', category: 'Organizations' },
    building2: { icon: Building2, label: 'Office Building', category: 'Organizations' },
    landmark: { icon: Landmark, label: 'Landmark', category: 'Organizations' },
    home: { icon: Home, label: 'Home', category: 'Organizations' },
    store: { icon: Store, label: 'Store', category: 'Organizations' },
    warehouse: { icon: Warehouse, label: 'Warehouse', category: 'Organizations' },
    hotel: { icon: Hotel, label: 'Hotel', category: 'Organizations' },
    church: { icon: Church, label: 'Church', category: 'Organizations' },
    school: { icon: School, label: 'School', category: 'Organizations' },
    hospital: { icon: Cross, label: 'Medical Center', category: 'Organizations' },
    factory: { icon: Factory, label: 'Factory', category: 'Organizations' },

    // People & Community
    users: { icon: Users, label: 'Community', category: 'People' },
    'user-circle': { icon: UserCircle, label: 'Person', category: 'People' },
    heart: { icon: Heart, label: 'Heart', category: 'People' },
    'heart-handshake': { icon: HeartHandshake, label: 'Partnership', category: 'People' },
    'hand-heart': { icon: HandHeart, label: 'Care', category: 'People' },
    handshake: { icon: Handshake, label: 'Handshake', category: 'People' },
    baby: { icon: Baby, label: 'Children', category: 'People' },
    'person-standing': { icon: PersonStanding, label: 'Individual', category: 'People' },
    accessibility: { icon: Accessibility, label: 'Accessibility', category: 'People' },

    // Education & Learning
    'graduation-cap': { icon: GraduationCap, label: 'Education', category: 'Education' },
    'book-open': { icon: BookOpen, label: 'Book', category: 'Education' },
    library: { icon: Library, label: 'Library', category: 'Education' },
    pen: { icon: Pen, label: 'Writing', category: 'Education' },
    pencil: { icon: Pencil, label: 'Pencil', category: 'Education' },

    // Health & Medical
    stethoscope: { icon: Stethoscope, label: 'Healthcare', category: 'Health' },
    pill: { icon: Pill, label: 'Medicine', category: 'Health' },
    syringe: { icon: Syringe, label: 'Vaccination', category: 'Health' },
    activity: { icon: Activity, label: 'Vitals', category: 'Health' },
    'heart-pulse': { icon: HeartPulse, label: 'Health', category: 'Health' },

    // Nature & Environment
    leaf: { icon: Leaf, label: 'Nature', category: 'Environment' },
    trees: { icon: Trees, label: 'Forest', category: 'Environment' },
    flower2: { icon: Flower2, label: 'Flower', category: 'Environment' },
    sun: { icon: Sun, label: 'Sun', category: 'Environment' },
    'cloud-sun': { icon: CloudSun, label: 'Weather', category: 'Environment' },
    droplets: { icon: Droplets, label: 'Water', category: 'Environment' },
    recycle: { icon: Recycle, label: 'Recycling', category: 'Environment' },

    // Food & Agriculture
    apple: { icon: Apple, label: 'Food', category: 'Food' },
    'utensils-crossed': { icon: UtensilsCrossed, label: 'Dining', category: 'Food' },
    wheat: { icon: Wheat, label: 'Agriculture', category: 'Food' },
    carrot: { icon: Carrot, label: 'Produce', category: 'Food' },

    // Technology
    laptop: { icon: Laptop, label: 'Computer', category: 'Technology' },
    monitor: { icon: Monitor, label: 'Screen', category: 'Technology' },
    smartphone: { icon: Smartphone, label: 'Mobile', category: 'Technology' },
    wifi: { icon: Wifi, label: 'Internet', category: 'Technology' },
    globe: { icon: Globe, label: 'Global', category: 'Technology' },
    code: { icon: Code, label: 'Code', category: 'Technology' },

    // Arts & Culture
    music: { icon: Music, label: 'Music', category: 'Arts' },
    palette: { icon: Palette, label: 'Art', category: 'Arts' },
    camera: { icon: Camera, label: 'Photography', category: 'Arts' },
    film: { icon: Film, label: 'Film', category: 'Arts' },
    mic: { icon: Mic, label: 'Audio', category: 'Arts' },
    theater: { icon: Theater, label: 'Theater', category: 'Arts' },

    // Sports & Recreation
    trophy: { icon: Trophy, label: 'Trophy', category: 'Sports' },
    medal: { icon: Medal, label: 'Achievement', category: 'Sports' },
    dumbbell: { icon: Dumbbell, label: 'Fitness', category: 'Sports' },
    bike: { icon: Bike, label: 'Cycling', category: 'Sports' },

    // Animals
    dog: { icon: Dog, label: 'Dog', category: 'Animals' },
    cat: { icon: Cat, label: 'Cat', category: 'Animals' },
    bird: { icon: Bird, label: 'Bird', category: 'Animals' },
    fish: { icon: Fish, label: 'Fish', category: 'Animals' },
    'paw-print': { icon: PawPrint, label: 'Pets', category: 'Animals' },

    // Finance & Business
    briefcase: { icon: Briefcase, label: 'Business', category: 'Business' },
    'dollar-sign': { icon: DollarSign, label: 'Finance', category: 'Business' },
    'piggy-bank': { icon: PiggyBank, label: 'Savings', category: 'Business' },
    'trending-up': { icon: TrendingUp, label: 'Growth', category: 'Business' },
    'bar-chart': { icon: BarChart3, label: 'Analytics', category: 'Business' },

    // Transportation
    car: { icon: Car, label: 'Car', category: 'Transport' },
    bus: { icon: Bus, label: 'Bus', category: 'Transport' },
    plane: { icon: Plane, label: 'Airplane', category: 'Transport' },
    ship: { icon: Ship, label: 'Ship', category: 'Transport' },

    // Communication
    mail: { icon: Mail, label: 'Email', category: 'Communication' },
    phone: { icon: Phone, label: 'Phone', category: 'Communication' },
    'message-circle': { icon: MessageCircle, label: 'Chat', category: 'Communication' },
    megaphone: { icon: Megaphone, label: 'Announcement', category: 'Communication' },

    // Misc
    star: { icon: Star, label: 'Star', category: 'Misc' },
    sparkles: { icon: Sparkles, label: 'Sparkles', category: 'Misc' },
    award: { icon: Award, label: 'Award', category: 'Misc' },
    gift: { icon: Gift, label: 'Gift', category: 'Misc' },
    shield: { icon: Shield, label: 'Protection', category: 'Misc' },
    lightbulb: { icon: Lightbulb, label: 'Ideas', category: 'Misc' },
    target: { icon: Target, label: 'Goal', category: 'Misc' },
    flag: { icon: Flag, label: 'Flag', category: 'Misc' },
    rocket: { icon: Rocket, label: 'Launch', category: 'Misc' },
    compass: { icon: Compass, label: 'Direction', category: 'Misc' },
  }

// Get icon component by name
export function getIconByName(name: string): LucideIcon | null {
  return ICON_REGISTRY[name]?.icon || null
}

// Render icon by name
export function IconByName({
  name,
  className,
  size = 24,
}: {
  name: string
  className?: string
  size?: number
}) {
  const IconComponent = getIconByName(name)
  if (!IconComponent) {
    // Fallback to Building2 if icon not found
    return <Building2 className={className} size={size} />
  }
  return <IconComponent className={className} size={size} />
}

interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  className?: string
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredIcons = Object.entries(ICON_REGISTRY).filter(([key, { label, category }]) => {
    const searchLower = search.toLowerCase()
    return (
      key.toLowerCase().includes(searchLower) ||
      label.toLowerCase().includes(searchLower) ||
      category.toLowerCase().includes(searchLower)
    )
  })

  // Group by category
  const groupedIcons = filteredIcons.reduce(
    (acc, [key, data]) => {
      if (!acc[data.category]) {
        acc[data.category] = []
      }
      acc[data.category].push({ key, ...data })
      return acc
    },
    {} as Record<string, Array<{ key: string; icon: LucideIcon; label: string; category: string }>>
  )

  const selectedIcon = value ? ICON_REGISTRY[value] : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-start gap-2', className)}
        >
          {selectedIcon ? (
            <>
              <selectedIcon.icon className="h-4 w-4" />
              <span>{selectedIcon.label}</span>
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Select an icon...</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-2">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="p-2">
            {Object.entries(groupedIcons).map(([category, icons]) => (
              <div key={category} className="mb-4">
                <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                  {category}
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {icons.map(({ key, icon: Icon, label }) => (
                    <Button
                      key={key}
                      variant={value === key ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'h-9 w-9 p-0',
                        value === key && 'bg-[#c4e5c1] hover:bg-[#b3d9b0]'
                      )}
                      onClick={() => {
                        onChange(key)
                        setOpen(false)
                        setSearch('')
                      }}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {filteredIcons.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">No icons found</div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default IconPicker
