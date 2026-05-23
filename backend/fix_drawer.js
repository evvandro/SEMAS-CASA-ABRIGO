
const fs = require('fs');
const path = '../Frontend/src/modules/acolhidos/components/FichaDrawer.tsx';
let content = fs.readFileSync(path, 'utf8');

const effectCode = \  useEffect(() => {
    let active = true

    async function load() {
      if (!row?.familyId) {
        setFamilia(null)
        setLoadingFamilia(false)
        return
      }

      setLoadingFamilia(true)
      try {
        const data = await fetchFamiliaDetail(row.familyId)
        if (active) {
          setFamilia(data)
        }
      } catch (err) {
        if (active) {
          setFamilia(null)
        }
      } finally {
        if (active) {
          setLoadingFamilia(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [row?.familyId])\;

const startIdx = content.indexOf('  useEffect(() => {');
const endIdx = content.indexOf('  }, [row?.familyId])') + '  }, [row?.familyId])'.length;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + effectCode + content.substring(endIdx);
  fs.writeFileSync(path, content);
  console.log('Fixed FichaDrawer.tsx');
} else {
  console.log('Could not find effect block');
}

