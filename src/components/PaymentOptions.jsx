import { CreditCard, Landmark, ShieldCheck } from 'lucide-react';
import { formatPrice, getPaymentAmounts } from '../lib/catalog';

const bankLogos = [
  ['Bank of Ceylon', '/assets/Banks/Bank%20of%20Ceylon.png'],
  ['Commercial Bank', '/assets/Banks/commercial-bank.png'],
  ['Sampath Bank', '/assets/Banks/sampath.png'],
  ['NDB Bank', '/assets/Banks/ndb.png'],
  ['DFCC Bank', '/assets/Banks/DFCC.png'],
  ['Seylan Bank', '/assets/Banks/Seylan%20bank.png'],
  ['Union Bank', '/assets/Banks/Union%20Bank.png'],
];

export default function PaymentOptions({ amount }) {
  const payments = getPaymentAmounts(amount);
  if (!payments) return null;

  return (
    <section className="payment-options" aria-labelledby="payment-options-title">
      <div className="payment-options__heading">
        <span><ShieldCheck size={18} /></span>
        <div><h2 id="payment-options-title">Choose how you pay</h2><p>Clear totals for the option that works for you.</p></div>
      </div>
      <div className="payment-options__grid">
        <article className="payment-option payment-option--bank">
          <span className="payment-option__icon"><Landmark size={20} /></span>
          <div><small>Bank transfer</small><strong>{formatPrice(payments.bankTransfer)}</strong><p>Pay the original current price.</p></div>
        </article>
        <article className="payment-option payment-option--card">
          <span className="payment-option__icon"><CreditCard size={20} /></span>
          <div><small>Card payment</small><strong>{formatPrice(payments.cardPayment)}</strong><p>The payable card total.</p></div>
        </article>
        <article className="payment-option payment-option--koko">
          <img src="/assets/Banks/KOKO.png" width="54" height="25" loading="lazy" alt="Koko" />
          <div><small>Koko installment</small><strong>{formatPrice(payments.kokoInstallment)}</strong><p>Per month for 3 months.</p></div>
        </article>
      </div>
      <div className="payment-partners" aria-label="Bank and payment partners">
        <span>Bank & card partners</span>
        <div>{bankLogos.map(([name, src]) => <img key={name} src={src} width="72" height="32" loading="lazy" alt={name} />)}</div>
      </div>
      <p className="payment-options__note">Amounts follow the selected product option. Our team will confirm availability and the final payable amount before payment.</p>
    </section>
  );
}
