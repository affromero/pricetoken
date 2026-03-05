import type { ImageModelPricing } from 'pricetoken';
import styles from './ImagePricingTable.module.css';

interface ImagePricingTableProps {
  data: ImageModelPricing[];
}

function formatPrice(price: number): string {
  if (price < 0.001) return `$${price.toFixed(4)}`;
  if (price < 0.01) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(3)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLaunchDate(iso: string): string {
  const [year, month] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month!, 10) - 1]} ${year}`;
}

export function ImagePricingTable({ data }: ImagePricingTableProps) {
  const sorted = [...data].sort((a, b) => a.pricePerImage - b.pricePerImage);

  return (
    <div className={styles.root}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Model</th>
              <th>$/Image</th>
              <th>Quality</th>
              <th>Resolution</th>
              <th>Formats</th>
              <th>Launched</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((model) => (
              <tr key={model.modelId}>
                <td>{capitalize(model.provider)}</td>
                <td className={styles.modelName}>{model.displayName}</td>
                <td className={styles.price}>{formatPrice(model.pricePerImage)}</td>
                <td>{capitalize(model.qualityTier)}</td>
                <td className={styles.resolution}>{model.defaultResolution}</td>
                <td className={styles.formats}>{model.supportedFormats.join(', ')}</td>
                <td className={styles.date}>
                  {model.launchDate ? formatLaunchDate(model.launchDate) : '\u2014'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
