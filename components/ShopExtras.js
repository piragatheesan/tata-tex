import Link from 'next/link';

// Care tips and the quotation call-to-action under the product grid. Edit the text to suit the business.
const TIPS = [
  { icon: 'box', title: 'Caring in bulk', text: 'Before storing for a long time, make sure to wash and dry uniforms according to the care label to maintain their quality.' },
  { icon: 'hanger', title: 'Choosing sizes', text: 'Measure a few people instead of guessing, and always check the size charts. Uniforms should be comfortable and allow movement.' },
  { icon: 'shield', title: 'Caring for uniforms', text: 'Wash uniforms with mild detergent, avoid harsh chemicals, and iron at low heat. Proper care increases their lifespan and keeps them looking professional.' },
];

function Icon({ name }) {
  const paths = {
    box: <><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
    hanger: <><path d="M12 8V6.5a2 2 0 1 0-2-2" /><path d="M12 8l9 6.2a1.4 1.4 0 0 1-.8 2.5H3.8A1.4 1.4 0 0 1 3 14.2L12 8z" /></>,
    shield: <><path d="M12 3l8 3v6c0 4.4-3.2 8-8 9-4.8-1-8-4.6-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  };
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function ShopExtras() {
  return (
    <>
      <section className="tips">
        <h2>Uniform buying and care tips</h2>
        <div className="tipgrid">
          {TIPS.map((t) => (
            <article key={t.title} className="tip">
              <Icon name={t.icon} />
              <div><h3>{t.title}</h3><p>{t.text}</p></div>
            </article>
          ))}
        </div>
      </section>
      <section className="promo">
        <h2>Ordering for a school, hospital, hotel or company?</h2>
        <p>Send us your list and quantities and ask for a wholesale quotation.</p>
        <div className="row">
          <Link className="btn-pill" href="/contact?type=quote">Request a quotation</Link>
          <Link className="btn-outline txt-link" href="/contact">Contact us →</Link>
        </div>
      </section>
    </>
  );
}
