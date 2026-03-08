import type { Meta, StoryObj } from '@storybook/react'
import { ScrollArea, ScrollBar } from './scroll-area'
import { Separator } from './separator'

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ScrollArea>

const tags = Array.from({ length: 50 }).map((_, i) => `Tag ${i + 1}`)

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

const artworks = [
  { title: 'Artwork 1', artist: 'Artist A' },
  { title: 'Artwork 2', artist: 'Artist B' },
  { title: 'Artwork 3', artist: 'Artist C' },
  { title: 'Artwork 4', artist: 'Artist D' },
  { title: 'Artwork 5', artist: 'Artist E' },
  { title: 'Artwork 6', artist: 'Artist F' },
  { title: 'Artwork 7', artist: 'Artist G' },
  { title: 'Artwork 8', artist: 'Artist H' },
]

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {artworks.map((artwork) => (
          <figure key={artwork.title} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <div className="flex h-40 w-32 items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">{artwork.title}</span>
              </div>
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{artwork.artist}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
}

export const LongContent: Story = {
  render: () => (
    <ScrollArea className="h-[300px] w-[350px] rounded-md border p-4">
      <h4 className="mb-4 text-lg font-semibold">Terms of Service</h4>
      <p className="mb-4 text-sm text-muted-foreground">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
        laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
        architecto beatae vitae dicta sunt explicabo.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
        consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
      </p>
      <p className="text-sm text-muted-foreground">
        Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
        velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam
        quaerat voluptatem.
      </p>
    </ScrollArea>
  ),
}
