export function probabilityToFraction(prob) {
    if (!(prob >= 0 && prob <= 1)) {
        throw new Error('Probability must be between 0 and 1');
    }
    if (prob === 0) return { numerator: 0, denominator: 1 };
    if (prob === 1) return { numerator: 1, denominator: 1 };

    let terms = [];
    let x = prob;

    // First term (integer part)
    let term = Math.floor(x);
    terms.push(term);
    x = x - term;

    if (x === 0) {
        return convert(terms);
    }

    x = 1 / x;
    term = Math.floor(x);
    terms.push(term);

    if (term > 20) {
        return convert(terms);
    }

    let remainder = x - term;

    while (remainder > 1e-12) {
        x = 1 / remainder;
        term = Math.floor(x);
        if (term > 10) {
            const sig = terms[0] === 0 ? terms.slice(1) : terms;
            if (prob !== 1 && sig.length === 1 && sig[0] === 1) {
                terms.push(term);
                break;
            }
            break;
        }
        terms.push(term);
        remainder = x - term;
    }

    return convert(terms);
}

function convert(terms) {
    let num = 1;
    let den = 0;
    for (let i = terms.length - 1; i >= 0; i--) {
        [num, den] = [den + terms[i] * num, num];
    }
    return { numerator: num, denominator: den };
}
