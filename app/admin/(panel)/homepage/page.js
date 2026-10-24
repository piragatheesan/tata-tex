import { requireAdminRole } from '@/lib/auth';
import { getHomeSlides } from '@/lib/home-content';
import { saveHomeSlide } from '@/lib/home-actions';
import Banner from '@/components/admin/Banner';
import SubmitButton from '@/components/admin/SubmitButton';

export default async function HomepageSettings({ searchParams }) {
  await requireAdminRole();
  const slides = await getHomeSlides();
  return (
    <>
      <h1>Homepage slideshow</h1>
      <p>
        Slides change automatically every six seconds. Replace a picture or edit its text, then save
        that slide. Wide landscape pictures work best.
      </p>
      <Banner sp={await searchParams} />
      <div className="row g-4">
        {slides.map((slide, index) => (
          <section className="col-12 col-xl-4" key={index}>
            <div className="card h-100">
              <div className="card-body">
                <h2>Slide {index + 1}</h2>
                <img
                  src={slide.image}
                  alt={slide.alt}
                  width="600"
                  height="300"
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                />
                <form action={saveHomeSlide} className="admin-form">
                  <input type="hidden" name="index" value={index} />
                  <label>
                    Replace picture (JPG, PNG or WebP, up to 3 MB)
                    <input
                      className="form-control"
                      type="file"
                      name="image"
                      accept="image/jpeg,image/png,image/webp"
                    />
                  </label>
                  <label>
                    Image description
                    <input
                      className="form-control"
                      name="alt"
                      defaultValue={slide.alt}
                      required
                      maxLength={180}
                    />
                  </label>
                  <label>
                    Title
                    <textarea
                      className="form-control"
                      name="title"
                      defaultValue={slide.title}
                      required
                      maxLength={100}
                      rows={2}
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      className="form-control"
                      name="text"
                      defaultValue={slide.text}
                      required
                      maxLength={400}
                      rows={4}
                    />
                  </label>
                  <SubmitButton pendingLabel="Saving slide...">Save slide {index + 1}</SubmitButton>
                </form>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
