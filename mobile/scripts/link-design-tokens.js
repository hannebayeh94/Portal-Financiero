/**
 * Enlaza los paquetes compartidos @portal/* dentro de node_modules de mobile
 * (junction en Windows, symlink en Unix). Se ejecuta como postinstall.
 */
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const packagesRoot = path.resolve(projectRoot, '..', 'packages')
const sharedPackages = ['design-tokens', 'core']

function exists(p) {
  try {
    fs.statSync(p)
    return true
  } catch {
    return false
  }
}

for (const name of sharedPackages) {
  const linkPath = path.join(projectRoot, 'node_modules', '@portal', name)
  const targetPath = path.join(packagesRoot, name)

  if (exists(linkPath)) {
    console.log(`[link-shared-packages] ${name}: ya existe`)
    continue
  }
  if (!exists(targetPath)) {
    console.error(`[link-shared-packages] ${name}: no se encontró en ${targetPath}`)
    process.exitCode = 1
    continue
  }

  fs.mkdirSync(path.dirname(linkPath), { recursive: true })
  try {
    const type = process.platform === 'win32' ? 'junction' : 'dir'
    fs.symlinkSync(targetPath, linkPath, type)
    console.log(`[link-shared-packages] ${name}: creado -> ${targetPath}`)
  } catch (err) {
    console.error(`[link-shared-packages] ${name}: error: ${err.message}`)
    process.exitCode = 1
  }
}
