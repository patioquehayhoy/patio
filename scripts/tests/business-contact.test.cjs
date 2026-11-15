/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');

function load() {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/business-contact.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('pasted numbers keep only the ten national digits', () => {
  const { cleanPhoneInput } = load();
  assert.equal(cleanPhoneInput('55 1234 5678'), '5512345678');
  assert.equal(cleanPhoneInput('+52 1 55 1234 5678'), '5512345678');
  assert.equal(cleanPhoneInput('+52 (222) 123-4567'), '2221234567');
  assert.equal(cleanPhoneInput('044 55 1234 5678'), '5512345678');
  assert.equal(cleanPhoneInput('551234'), '551234', 'a number being typed is not cut');
  assert.equal(cleanPhoneInput('55123456789999'), '5512345678');
});

test('numbers read the way they are said in Mexico', () => {
  const { formatPhone, isCompletePhone } = load();
  assert.equal(formatPhone('5512345678'), '55 1234 5678');
  assert.equal(formatPhone('3312345678'), '33 1234 5678');
  assert.equal(formatPhone('2221234567'), '222 123 4567');
  assert.equal(isCompletePhone('5512345678'), true);
  assert.equal(isCompletePhone('551234567'), false);
  assert.equal(isCompletePhone(null), false);
});

test('call and WhatsApp links use the Mexican country code', () => {
  const { phoneCallUrl, whatsappUrl } = load();
  assert.equal(phoneCallUrl('5512345678'), 'tel:+525512345678');
  assert.equal(whatsappUrl('5512345678', 'Cocina Doña Lupe'), 'https://wa.me/525512345678?text=Hola%2C%20Cocina%20Do%C3%B1a%20Lupe.%20Te%20vi%20en%20Patio.');
  assert.equal(whatsappUrl('5512345678'), 'https://wa.me/525512345678?text=Hola%2C%20te%20vi%20en%20Patio.');
});

test('the contact columns are optional, validated and publicly readable', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261114090000_business_contact_phone.sql'), 'utf8');
  assert.match(sql, /contacto_telefono text\s+check \(contacto_telefono is null or contacto_telefono ~ '\^\[0-9\]\{10\}\$'\)/);
  assert.match(sql, /contacto_whatsapp boolean not null default false/);
  assert.match(sql, /grant select \(contacto_telefono, contacto_whatsapp\) on public\.negocios to anon, authenticated/);
});
