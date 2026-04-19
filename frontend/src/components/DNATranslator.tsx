import { useState } from 'react';

const CODON_TABLE: Record<string, string> = {
  'TTT': 'Phe', 'TTC': 'Phe', 'TTA': 'Leu', 'TTG': 'Leu',
  'CTT': 'Leu', 'CTC': 'Leu', 'CTA': 'Leu', 'CTG': 'Leu',
  'ATT': 'Ile', 'ATC': 'Ile', 'ATA': 'Ile',
  'ATG': 'Met',
  'GTT': 'Val', 'GTC': 'Val', 'GTA': 'Val', 'GTG': 'Val',
  'TCT': 'Ser', 'TCC': 'Ser', 'TCA': 'Ser', 'TCG': 'Ser',
  'CCT': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
  'ACT': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
  'GCT': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
  'TAT': 'Tyr', 'TAC': 'Tyr',
  'CAT': 'His', 'CAC': 'His',
  'CAA': 'Gln', 'CAG': 'Gln',
  'AAT': 'Asn', 'AAC': 'Asn',
  'AAA': 'Lys', 'AAG': 'Lys',
  'GAT': 'Asp', 'GAC': 'Asp',
  'GAA': 'Glu', 'GAG': 'Glu',
  'TGT': 'Cys', 'TGC': 'Cys',
  'TGG': 'Trp',
  'CGT': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
  'AGT': 'Ser', 'AGC': 'Ser',
  'AGA': 'Arg', 'AGG': 'Arg',
  'GGT': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly',
};

const AMINO_ACID_FULL: Record<string, string> = {
  Phe: 'Phenylalanine', Leu: 'Leucine', Ile: 'Isoleucine', Met: 'Methionine',
  Val: 'Valine', Ser: 'Serine', Pro: 'Proline', Thr: 'Threonine',
  Ala: 'Alanine', Tyr: 'Tyrosine', His: 'Histidine', Gln: 'Glutamine',
  Asn: 'Asparagine', Lys: 'Lysine', Asp: 'Aspartic acid', Glu: 'Glutamic acid',
  Cys: 'Cysteine', Trp: 'Tryptophan', Arg: 'Arginine', Gly: 'Glycine',
};

interface CodonResult {
  codon: string;
  amino: string;
  fullName: string;
  valid: boolean;
}

export default function DNATranslator() {
  const [dna, setDna] = useState('');
  const [results, setResults] = useState<CodonResult[]>([]);

  const translate = (input: string) => {
    const clean = input.toUpperCase().replace(/[^ATCG]/g, '');
    setDna(clean);
    
    const codons: CodonResult[] = [];
    for (let i = 0; i < clean.length; i += 3) {
      const codon = clean.slice(i, i + 3);
      if (codon.length === 3) {
        const amino = CODON_TABLE[codon] || '???';
        codons.push({
          codon,
          amino,
          fullName: AMINO_ACID_FULL[amino] || (amino === '???' ? 'Unknown' : amino),
          valid: !!CODON_TABLE[codon],
        });
      }
    }
    setResults(codons);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    translate(e.target.value);
  };

  const exampleDNA = 'ATGTTTGCTCCCTTC';

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200">
      <h3 className="text-xl font-bold text-purple-700 mb-2">🧬 DNA Translator</h3>
      <p className="text-sm text-slate-600 mb-4">
        Type DNA letters (A, T, C, G) below. The cell reads them in groups of three (codons) to build proteins!
      </p>
      
      <textarea
        value={dna}
        onChange={handleInput}
        placeholder={`Try: ${exampleDNA}`}
        className="w-full p-3 border-2 border-purple-300 rounded-lg font-mono text-lg tracking-wider focus:border-purple-500 focus:outline-none"
        rows={2}
      />
      
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => translate(exampleDNA)}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors"
        >
          Try Example
        </button>
        <button
          onClick={() => translate('ATG')}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition-colors"
        >
          Start (ATG)
        </button>
        <button
          onClick={() => translate('')}
          className="px-3 py-1 bg-slate-600 text-white text-sm rounded-full hover:bg-slate-700 transition-colors"
        >
          Clear
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Codons → Amino Acids:
          </p>
          <div className="flex flex-wrap gap-1">
            {results.map((r, i) => (
              <div
                key={i}
                className={`px-2 py-1 rounded text-sm font-medium ${
                  r.valid 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
                title={`${r.fullName}`}
              >
                {r.codon}
                <span className="text-xs opacity-75 ml-1">→</span>
                <span className="font-bold ml-1">{r.amino}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-1">Protein Sequence:</p>
            <code className="text-purple-600 font-mono">
              {results.filter(r => r.valid).map(r => r.amino).join('-')}
            </code>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-slate-500 bg-white/50 p-2 rounded">
        💡 Tip: DNA is read in groups of 3 letters. ATG = "Start" signal, then the cell builds from there!
      </div>
    </div>
  );
}
