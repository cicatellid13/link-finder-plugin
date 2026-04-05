package main

import (
	"fmt"
	"os"
	"strings"

	"golang.org/x/net/html"
)

type DataHander struct {
	PageHtml string
	Results  []map[string]string
}

// type IOHandler interface {
// 	Send() (string, error)
// 	// Receive() (string, error)
// }

func (dh *DataHander) ParseData(pageBytes []byte) []map[string]string {
	// htmlDataBytes, err := os.ReadFile("test.html")

	// if err != nil {
	// 	log.Fatalf("issue reading html file: %e", err)
	// }
	dh.Results = nil
	dh.PageHtml = string(pageBytes)

	doc, err := html.Parse(strings.NewReader(dh.PageHtml))
	if err != nil {
		fmt.Fprintln(os.Stderr, "issue parsing html:", err)
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
