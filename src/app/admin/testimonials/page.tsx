
import { getTestimonials } from "@/services/testimonialsService";
import { AdminTestimonialsView } from "./_components/AdminTestimonialsView";

export default async function AdminTestimonialsPage() {
    const testimonials = await getTestimonials();
    return <AdminTestimonialsView initialTestimonials={testimonials} />;
}
