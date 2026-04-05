package main

import (
	"log"
	"os"
	"strings"

	"golang.org/x/net/html"
)

type DataHander struct {
	PageHtml string
	Results  []map[string]string
}

type MainWorker interface {
	poll() string
	send() string
}

func (dh *DataHander) parseData() []map[string]string {
	htmlDataBytes, err := os.ReadFile("test.html")
	if err != nil {
		log.Fatalf("issue reading html file: %e", err)
	}
	dh.PageHtml = string(htmlDataBytes)

	doc, err := html.Parse(strings.NewReader(dh.PageHtml))
	if err != nil {
		log.Fatalf("issue parsing html: %e", err)
	}

	dh.extractLinks(doc)
	return dh.Results

}

func (dh *DataHander) extractLinks(n *html.Node) {
	if n.Type == html.ElementNode && n.Data == "a" {
		dh.processLink(n)
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		dh.extractLinks(c)
	}

}

func (dh *DataHander) processLink(n *html.Node) {
	var link, label string

	for _, attr := range n.Attr {
		if attr.Key == "href" {
			link = attr.Val
			break
		}
	}
	if link == "" {
		return
	}

	if n.FirstChild != nil && n.FirstChild.Type == html.TextNode {
		label = strings.TrimSpace(n.FirstChild.Data)
	}
	if isRealLink(link) {
		if len(label) > 0 {
			dh.Results = append(dh.Results, map[string]string{label: link})
		} else {
			dh.Results = append(dh.Results, map[string]string{"link": link})
		}
	}
}

func isRealLink(link string) bool {
	lowerLink := strings.ToLower(link)
	return strings.Contains(lowerLink, "www") || strings.Contains(lowerLink, "http")
}

func main() {
	dh := &DataHander{}
	links := dh.parseData()

	for _, link := range links {
		// log.Println(link["link"])
		for k, v := range link {
			log.Println(k, v)
		}
	}
}
