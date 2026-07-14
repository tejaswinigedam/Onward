import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer className="site-foot">
      <div className="foot-inner">
        <div className="foot-brand">
          <BrandMark className="foot-mark" />
          <span className="foot-name">Onward</span>
        </div>
        <div className="foot-right">
          <p className="foot-copy">© 2026 Onward. All rights reserved.</p>
          <p className="foot-contact">
            Contact: <a href="mailto:onwardsupport@gmail.com">onwardsupport@gmail.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
