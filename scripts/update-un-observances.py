"""Refresh official UN observances. Failed/partial downloads never erase good data."""
import calendar, datetime, json, re, sys, urllib.request
from html.parser import HTMLParser
from pathlib import Path
PRIMARY='https://www.un.org/en/observances/list-days-weeks'
FALLBACK='https://indonesia.un.org/en/291543-list-international-days-and-weeks'
DEST=Path(__file__).resolve().parents[1]/'assets/un-observances.json'
MONTHS={name.lower():i for i,name in enumerate(calendar.month_abbr) if name}
class TextBlocks(HTMLParser):
 def __init__(self): super().__init__(); self.lines=[];self.parts=[];self.links=[]
 def flush(self):
  text=' '.join(''.join(self.parts).split())
  if text:self.lines.append((text,self.links[:]))
  self.parts=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag in ('p','div','h2','h3','li','tr','br'):self.flush()
  if tag=='a':
   url=dict(attrs).get('href','')
   if url.startswith('https://') and 'undocs.org' not in url:self.links.append(url)
 def handle_endtag(self,tag):
  if tag in ('p','div','h2','h3','li','tr'):self.flush()
 def handle_data(self,data):self.parts.append(data)
def parse(html):
 parser=TextBlocks();parser.feed(html);parser.flush();items=[];previous=None
 for text,links in parser.lines:
  before=re.match(r'^(\d{1,2})\s+([A-Za-z]{3})\s*\|\s*(.+)',text)
  after=re.fullmatch(r'(\d{1,2})\s+([A-Za-z]{3})',text)
  if before: day,month,title=before.groups()
  elif after and previous:day,month=after.groups();title,links=previous
  else:previous=(text,links);continue
  month=MONTHS.get(month.lower())
  if not month:continue
  title=re.split(r'\s*\((?:A/|UNESCO|WHO|OPCW|\d)',title)[0].strip()
  if not title or len(title)>240:continue
  item={'month':month,'day':int(day),'title':title,'url':links[0] if links else PRIMARY}
  # Nth-weekday observances cannot repeat the source page's old calendar date.
  for phrase,rule in [('World Habitat Day',[10,0,1]),('World Philosophy Day',[11,3,3]),('World Day of Remembrance for Road Traffic Victims',[11,6,3]),('International Day of Cooperatives',[7,5,1]),('World Maritime Day',[9,3,-1])]:
   if phrase in title:item['weekdayRule']=rule
  if 'Migratory Bird Day' in title:item['weekdayRule']=[month,5,2]
  if 'Vesak' in title:item['variableDate']=True
  span=re.search(r'(\d{1,2})\s*[-–]\s*(\d{1,2})\s+[A-Za-z]+',title)
  if span:item['endDay']=int(span.group(2))
  items.append(item);previous=None
 unique={(x['month'],x['day'],x['title']):x for x in items}
 result=sorted(unique.values(),key=lambda x:(x['month'],x['day'],x['title']))
 if len(result)<150 or len({x['month'] for x in result})!=12:raise ValueError('Incomplete UN response; preserving previous calendar')
 return result

def main():
 errors=[]
 for url in (PRIMARY,FALLBACK):
  try:
   if len(sys.argv)>1:html=Path(sys.argv[1]).read_text();url=FALLBACK
   else:
    req=urllib.request.Request(url,headers={'User-Agent':'BIGLWA-Observances/1.0 (+https://biglwa.com)'})
    with urllib.request.urlopen(req,timeout=25) as response:html=response.read().decode('utf-8')
   items=parse(html)
   old=json.loads(DEST.read_text()) if DEST.exists() else None
   if old and len(items)<len(old['items'])*.85:raise ValueError('Unexpected record loss; keeping last good calendar')
   data={'source':PRIMARY,'retrievedFrom':url,'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'items':items}
   DEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(f'Updated {len(items)} official UN observances from {url}');return
  except Exception as error:errors.append(f'{url}: {error}')
 raise SystemExit('\n'.join(errors))
if __name__=='__main__':main()
