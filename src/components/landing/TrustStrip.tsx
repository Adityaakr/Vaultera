import { motion } from 'framer-motion';

const stats = [
  { label: 'AI Agents Live', value: '14' },
  { label: 'Decisions Logged', value: '2.1M+' },
  { label: 'Capital Under Agents', value: '$4.8B' },
  { label: 'Best Agent (30d)', value: '+14.8%' },
  { label: 'Avg Trust Score', value: '92%' },
  { label: 'On-Chain Uptime', value: '99.98%' },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-card py-10">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <p className="font-display text-2xl font-bold text-foreground tabular-nums md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
