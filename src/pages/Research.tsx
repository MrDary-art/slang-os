import { ArrowUpRight, BookOpen, Download, Printer } from 'lucide-react';
import { categoryLabels, lexicon } from '../data/lexicon';
import { researchSections, researchTitle, sources, type ResearchSection } from '../data/research';
import researchPdf from '../../docs/RESEARCH.pdf?url';

function Classification() {
  return <div className="classification-diagram"><div><h3>Где употребляют</h3><span>Молодёжный сленг</span><span>Цифровая коммуникация</span><span>Профессиональная речь</span></div><div className="classification-intersection"><BookOpen size={24} /><strong>Языковая единица</strong><span>«фиксануть»</span></div><div><h3>Как образовано</h3><span>Заимствование</span><span>Освоение и словообразование</span><span>Перенос значения</span></div></div>;
}
function Section({ section }: { section: ResearchSection }) {
  return <section id={`research-${section.id}`} className={section.id === 'classification' ? 'classification-section' : ''}>
    <h2>{section.title}</h2>
    {section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
    {section.id === 'classification' && <Classification />}
  </section>;
}
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ block: 'start' });

export function Research() {
  const narrative = researchSections.filter(section => section.id !== 'conclusion');
  const conclusion = researchSections.find(section => section.id === 'conclusion');
  return <main id="main" className="page research-page page-enter">
    <div className="page-heading no-print"><div><div className="case-label"><BookOpen size={18} /> Научная основа проекта</div><h1>Исследование</h1><p>Как устроен интерактивный переводчик поколений.</p></div><div className="actions"><a className="quiet-link" href={researchPdf} download="Полякова_Переводчик_поколений.pdf"><Download size={17} /> Скачать PDF</a><button className="button button-secondary" onClick={() => window.print()}><Printer size={18} /> Печать / Сохранить как PDF</button></div></div>
    <article className="research-document">
      <header className="research-title"><span className="document-mark">Лексикографический проект · 2026</span><h2>{researchTitle}</h2><p>Полякова Дарья Александровна</p><p>РТУ МИРЭА · ЭФБО-05-25 · 2 курс<br />Информационные системы и технологии · Fullstack-разработка</p><p className="muted">Москва, 2026</p><p className="research-project-link">Творческая часть: <a href="https://mrdary-art.github.io/slang-os/">mrdary-art.github.io/slang-os/</a></p></header>
      <div className="research-contents no-print"><strong>В этой работе</strong>{narrative.map(section => <button key={section.id} onClick={() => scrollTo(`research-${section.id}`)}>{section.title}</button>)}<button onClick={() => scrollTo('lexical-passports')}>Лексикографические паспорта всех слов</button><button onClick={() => scrollTo('research-conclusion')}>Заключение</button><button onClick={() => scrollTo('research-sources')}>Источники</button><button onClick={() => scrollTo('bilingual-table')}>Итоговый двуязычный словарь</button></div>
      {narrative.map(section => <Section key={section.id} section={section} />)}
      <section id="lexical-passports" className="lexical-passports"><h2>Лексикографические паспорта единиц</h2><p>Определения на двух языках собраны в итоговой таблице. Ниже приведены грамматические характеристики, анализ образования и авторские контекстные примеры каждой единицы. Источники сверяются по библиографии; гипотезы не выдаются за установленные исторические факты.</p>
        {lexicon.map(word => <article className="research-entry" key={word.id}>
          <h3>{word.word}</h3><p className="entry-metadata">{categoryLabels[word.category]} · {word.partOfSpeech}</p>
          <p><strong>Происхождение.</strong> {word.etymology}</p><p><strong>Образование.</strong> {word.formation}</p>
          <p><strong>Пример.</strong> «{word.example}»</p><p><strong>Нейтрально.</strong> {word.neutral}</p>
          <p><strong>Употребление.</strong> {word.context} {word.tone}</p><p><strong>Ограничения интерпретации.</strong> {word.caution}</p>
          <p className="entry-source-status"><strong>Статус сведений.</strong> {word.etymologyStatus} {word.sourceIds.length > 0 ? `См. источники ${word.sourceIds.map(id => sources.findIndex(source => source.id === id) + 1).join(', ')}.` : 'Словообразовательный анализ и примеры авторские; историческое происхождение отдельно не установлено.'}</p>
        </article>)}
      </section>
      {conclusion && <Section section={conclusion} />}
      <section id="research-sources"><h2>Источники и статус сведений</h2><p>Ссылки подтверждают указанный смысл, форму или отдельный языковой анализ. Английская дефиниция сама по себе не устанавливает историю появления слова в русском языке. Прямые цитаты из источников не используются.</p><ol className="bibliography">{sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={14} /></a><p>{source.note}</p><span className="print-url">{source.url}</span></li>)}</ol><p>Учебные определения, переводы, примеры и сценарии составлены для этого проекта. Дата проверки интернет-источников: 16 ноября 2026 года.</p></section>
      <section id="bilingual-table" className="bilingual-section"><h2>Итоговая двуязычная таблица</h2><p>Полная авторская подборка: {lexicon.length} единица. Это учебный материал, а не частотный словарь студенческой речи.</p><table className="bilingual-table"><thead><tr><th scope="col">Единица</th><th scope="col">Определение на русском</th><th scope="col" lang="en">Definition in English</th><th scope="col">Сфера</th></tr></thead><tbody>{lexicon.map(word => <tr key={word.id}><th scope="row"><a href={`#/word/${word.id}`}>{word.word}</a></th><td>{word.definitionRu}</td><td lang="en">{word.definitionEn}</td><td>{categoryLabels[word.category]}</td></tr>)}</tbody></table></section>
    </article>
  </main>;
}
