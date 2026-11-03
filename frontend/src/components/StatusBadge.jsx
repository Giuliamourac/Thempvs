import { ROTULO_STATUS } from '../utils/orders.js';

export default function StatusBadge({ status }) {
  return <span className={`badge-status badge-${String(status).toLowerCase()}`}>{ROTULO_STATUS[status] ?? status}</span>;
}
