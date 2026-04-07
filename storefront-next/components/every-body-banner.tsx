type EveryBodyBannerContent = {
  titleLineOne: string;
  titleLineTwo: string;
  emphasis: string;
  image: {
    src: string;
    alt: string;
  };
  items: Array<{
    key: "studies" | "life" | "experts";
    label: string;
  }>;
};

function StudiesIcon() {
  return (
    <svg viewBox="0 0 29 37" aria-hidden="true">
      <path d="M28.9564 2.28125H-0.015625V36.1671H28.9564V2.28125Z" fill="currentColor" />
      <path d="M22.4205 0.84375H6.51953V5.29175H22.4205V0.84375Z" fill="none" stroke="currentColor" strokeWidth="1.49" />
      <path d="M18.2412 0H10.8242V2.24931H18.2412V0Z" fill="currentColor" />
      <path d="M13.1914 13.2383H25.0701" stroke="#111C35" strokeWidth="1.49" />
      <path d="M4.82812 13.2375L6.51696 14.7389L10.0086 11.7305" stroke="#111C35" strokeWidth="1.49" />
      <path d="M13.1914 20.2031H25.0701" stroke="#111C35" strokeWidth="1.49" />
      <path d="M4.82812 20.2102L6.51696 21.7115L10.0086 18.7031" stroke="#111C35" strokeWidth="1.49" />
      <path d="M13.1914 27.2773H25.0701" stroke="#111C35" strokeWidth="1.49" />
      <path d="M4.82812 27.2844L6.51696 28.7858L10.0086 25.7773" stroke="#111C35" strokeWidth="1.49" />
    </svg>
  );
}

function LifeIcon() {
  return (
    <svg viewBox="0 0 28 37" aria-hidden="true">
      <path d="M14.47 20.5425H17.1296H20.4336L16.3814 12.6782V0H10.7346L10.6527 13.011L6.98828 20.5425H14.47Z" fill="currentColor" />
      <path d="M20.4353 20.543H6.99017L0 34.8961L0.890136 36.3603H26.9395L27.8242 34.8795L20.4353 20.543Z" fill="currentColor" />
      <path d="M7.72656 26.6914L12.2703 31.2058L17.7586 21.6445" stroke="#111C35" strokeWidth="1.49" />
    </svg>
  );
}

function ExpertsIcon() {
  return (
    <svg viewBox="0 0 55 37" aria-hidden="true">
      <path d="M54.5631 21.2617C54.5631 18.7481 52.2353 15.9798 47.0306 15.9798L5.18774 15.9223V4.41115H22.9845C24.3846 4.41115 25.0562 4.87391 25.0562 6.14714V14.4492H30.241C30.241 14.4492 30.2467 5.62415 30.241 5.30652C30.2041 2.79565 27.6487 0 24.4729 0H0V20.3745H47.2639C48.8661 20.3745 49.2815 20.7688 49.2815 22.3049V30.2401C49.2758 31.549 48.6185 31.9596 47.2639 31.9596H30.241V21.8832H25.0562V36.3051H48.792C49.4153 36.3051 49.8222 36.023 50.0613 35.5192C50.2149 35.1988 50.3657 34.8621 50.4226 34.517C50.6588 33.0714 51.5096 32.1458 52.9354 31.6886C54.0167 31.3408 54.5688 30.6152 54.5602 29.5391V21.2589L54.5631 21.2617Z" fill="currentColor" />
    </svg>
  );
}

function BannerIcon({ icon }: { icon: "studies" | "life" | "experts" }) {
  if (icon === "studies") {
    return <StudiesIcon />;
  }

  if (icon === "life") {
    return <LifeIcon />;
  }

  return <ExpertsIcon />;
}

export function EveryBodyBanner({ content }: { content: EveryBodyBannerContent }) {
  return (
    <section className="shell page-section every-body-banner">
      <div className="every-body-banner__inner">
        <div className="every-body-banner__copy">
          <h2>
            {content.titleLineOne}
            <br />
            {content.titleLineTwo} <em>{content.emphasis}</em>
          </h2>

          <div className="every-body-banner__items">
            {content.items.map((item) => (
              <div key={item.key} className="every-body-banner__item">
                <span className="every-body-banner__icon">
                  <BannerIcon icon={item.key} />
                </span>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="every-body-banner__media">
          <img src={content.image.src} alt={content.image.alt} className="every-body-banner__image" />
        </div>
      </div>
    </section>
  );
}
