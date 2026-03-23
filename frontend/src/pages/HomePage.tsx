import { Hero } from '@/app/components/vase/Hero';
import { Divider } from '@/app/components/vase/Divider';
import { Collection } from '@/app/components/vase/Collection';
import { Story } from '@/app/components/vase/Story';
import { Craftsmanship } from '@/app/components/vase/Craftsmanship';
import { ShopPreview } from '@/app/components/vase/ShopPreview';
import { Contact } from '@/app/components/vase/Contact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Divider />
      <Collection />
      <Story />
      <Craftsmanship />
      <ShopPreview />
      <Contact />
    </>
  );
}
