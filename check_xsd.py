import sys
try:
    with open('xsd_temp.xml', 'rb') as f:
        content = f.read().decode('utf-16', errors='ignore')
    
    # faturaOlusturExt elementini bul
    start = content.find('name="faturaOlusturExt"')
    if start != -1:
        print("--- faturaOlusturExt element ---")
        print(content[start:start+500])
        
    # faturaOlusturInput tipini bul
    start_type = content.find('name="faturaOlusturInput"')
    if start_type != -1:
        print("--- faturaOlusturInput complexType ---")
        end_type = content.find('</xs:complexType>', start_type)
        print(content[start_type:end_type+20])
        
    # belge complexType bul
    start_belge = content.find('<xs:complexType name="belge">')
    if start_belge != -1:
        print("--- belge complexType ---")
        end_belge = content.find('</xs:complexType>', start_belge)
        print(content[start_belge:end_belge+20])
        # Also print what's inside sequence
        s_start = content.find('<xs:sequence>', start_belge)
        s_end = content.find('</xs:sequence>', s_start)
        print("--- sequence content ---")
        print(content[s_start:s_end+15])

except Exception as e:
    print(f"Error: {e}")
