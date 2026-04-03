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
		for _, attr := range n.Attr {
			if attr.Key == "href" {
				lowerAttrVal := strings.ToLower(attr.Val)
				realLink := strings.Contains(lowerAttrVal, "www") || strings.Contains(lowerAttrVal, "http")
				if realLink == true {
					dh.Results = append(dh.Results, map[string]string{"link": attr.Val})
				}
			}
		}
	}

	// Recursively call extractLinks on child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		dh.extractLinks(c)
	}
}

func main() {
	dh := &DataHander{}
	links := dh.parseData()

	for _, link := range links {
		log.Println(link["link"])
	}
}
