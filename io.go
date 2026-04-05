package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

type Response struct {
	Success bool                `json:"success"`
	Links   []map[string]string `json:"links"`
}

func readMessage() (map[string]any, error) {
	var length uint32

	if err := binary.Read(os.Stdin, binary.LittleEndian, &length); err != nil {
		return nil, err
	}

	data := make([]byte, length)
	if _, err := io.ReadFull(os.Stdin, data); err != nil {
		return nil, err
	}

	var msg map[string]any
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, err
	}

	return msg, nil
}

func writeMessage(msg Response) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	length := uint32(len(data))
	if err := binary.Write(os.Stdout, binary.LittleEndian, &length); err != nil {
		return err
	}

	if _, err := os.Stdout.Write(data); err != nil {
		return err
	}

	return nil
}

func run() {
	dh := DataHander{}
	for {
		input, err := readMessage()
		if err != nil {
			if err == io.EOF {
				return
			}
			fmt.Fprintln(os.Stderr, "read error:", err)
			return
		}

		htmlStr, ok := input["html"].(string)
		if !ok {
			fmt.Fprintln(os.Stderr, "invalid html data")
			jsonResp := Response{
				Success: false,
				Links:   nil,
			}
			if err := writeMessage(jsonResp); err != nil {
				fmt.Fprintln(os.Stderr, "write error:", err)
				return
			}
			continue
		}
		links := dh.ParseData([]byte(htmlStr))

		success := len(links) > 0

		jsonResp := Response{
			Success: success,
			Links:   links,
		}

		if err := writeMessage(jsonResp); err != nil {
			fmt.Fprintln(os.Stderr, "write error:", err)
			return
		}
	}
}
