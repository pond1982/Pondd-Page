import hashlib
import importlib.util
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'data/apps.json').read_text())
HTML = (ROOT / 'index.html').read_text()

class Elements(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

class DirectoryTests(unittest.TestCase):
    def test_inventory_and_links(self):
        apps = DATA['apps']
        self.assertEqual(len(apps), 21)
        self.assertEqual(len({a['appStoreId'] for a in apps}), 21)
        for app in apps:
            self.assertEqual(urlparse(app['appStoreUrl']).hostname, 'apps.apple.com')
            self.assertTrue(urlparse(app['appStoreUrl']).path.endswith('id' + str(app['appStoreId'])))
            self.assertEqual(urlparse(app['websiteUrl']).scheme, 'https')
            self.assertIn(app['websiteUrl'], HTML)
            self.assertIn(app['appStoreUrl'], HTML)
            self.assertTrue((ROOT / app['icon']).is_file())
        # These apps keep the verified Cloudflare destinations and current hosting.
        self.assertEqual(len([a for a in apps if urlparse(a['websiteUrl']).hostname.endswith('.pages.dev')]), 5)

    def test_generated_section_is_current(self):
        spec = importlib.util.spec_from_file_location('builder', ROOT / 'scripts/build-app-directory.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        generated = module.render(DATA)
        self.assertIn(generated, HTML)

    def test_ids_anchors_and_local_paths(self):
        elements = Elements(HTML).tags
        ids = [attrs['id'] for _, attrs in elements if 'id' in attrs]
        self.assertEqual(len(ids), len(set(ids)))
        for tag, attrs in elements:
            for key in ('href', 'src'):
                value = attrs.get(key, '')
                if not value or value == '#':
                    continue
                if value.startswith('#'):
                    self.assertIn(value[1:], ids)
                elif not urlparse(value).scheme and not value.startswith('//'):
                    self.assertTrue((ROOT / unquote(value.split('#')[0])).is_file(), value)

    def test_original_cv_is_unchanged_except_additions(self):
        restored = re.sub(r'  <!-- APP DIRECTORY START:.*?<!-- APP DIRECTORY END -->\n\n', '', HTML, flags=re.S)
        restored = restored.replace('<link rel="stylesheet" href="assets/app-directory.css">\n<script src="assets/app-directory.js" defer></script>\n', '')
        restored = restored.replace('      <a href="#apps">Apps</a>\n', '')
        restored = restored.replace('      <a class="app-shortcut" href="#apps">Explore my apps <span>21 released on the App Store <span aria-hidden="true">↘</span></span></a>\n\n', '')
        # SHA-256 of index.html from initial commit 8d4ab07. All original wording,
        # styles, markup, anchors and behavior must remain byte-for-byte intact.
        self.assertEqual(hashlib.sha256(restored.encode()).hexdigest(), '3e1321f08f89721b0d30a7f25cfe3f9a93fd6194f322109484719f2b9ef560ba')

if __name__ == '__main__':
    unittest.main()
